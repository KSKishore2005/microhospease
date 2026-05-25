package com.cognizant.billing.service;

import com.cognizant.billing.common.exception.BadRequestException;
import com.cognizant.billing.common.exception.ResourceNotFoundException;
import com.cognizant.billing.entity.Invoice;
import com.cognizant.billing.entity.Payment;
import com.cognizant.billing.enums.InvoiceStatus;
import com.cognizant.billing.enums.PaymentStatus;
import com.cognizant.billing.repository.InvoiceRepository;
import com.cognizant.billing.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByInvoice(Long invoiceId) {
        if (!invoiceRepository.existsById(invoiceId)) {
            throw new ResourceNotFoundException("Invoice", "id", invoiceId);
        }
        return paymentRepository.findByInvoice_InvoiceId(invoiceId);
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByGuest(Long guestId) {
        return paymentRepository.findByGuestId(guestId);
    }

    /**
     * Accepts a payment against an invoice. Supports partial payments and multiple
     * installments — the invoice is only marked PAID when cumulative successful
     * payments meet or exceed the invoice total. Overpayments are rejected so the
     * books stay clean (a separate "refund" flow would handle tips/adjustments).
     */
    public Payment createPayment(Payment payment, Long invoiceId, Long guestId) {
        log.info("Creating payment for invoiceId={}, guestId={}, amount={}",
                invoiceId, guestId, payment.getAmount());

        if (payment.getAmount() == null || payment.getAmount().signum() <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero.");
        }

        // Pessimistic lock prevents two concurrent payments from both observing
        // the same remaining balance and double-applying. The lock is released
        // when the @Transactional method commits.
        Invoice invoice = invoiceRepository.findByIdForUpdate(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Invoice " + invoiceId + " is already PAID");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay a CANCELLED invoice");
        }

        if (!invoice.getGuestId().equals(guestId)) {
            throw new BadRequestException(
                    "Guest " + guestId + " does not own invoice " + invoiceId
                            + " (owned by guest " + invoice.getGuestId() + ")");
        }

        BigDecimal alreadyPaid = paymentRepository.sumSuccessfulPaymentsForInvoice(invoiceId);
        if (alreadyPaid == null) alreadyPaid = BigDecimal.ZERO;
        // Force a consistent 2-decimal scale on both operands so compareTo never
        // mis-fires due to scale drift (e.g. SUM(amount) returning scale=10).
        BigDecimal balance = invoice.getTotalAmount()
                .setScale(2, RoundingMode.HALF_UP)
                .subtract(alreadyPaid.setScale(2, RoundingMode.HALF_UP));

        if (balance.signum() <= 0) {
            // Defensive: the invoice is fully covered already but isn't marked PAID.
            invoice.setStatus(InvoiceStatus.PAID);
            invoiceRepository.save(invoice);
            throw new BadRequestException("Invoice " + invoiceId + " already fully paid.");
        }

        // Reject overpayments — the system has no concept of credit balances.
        if (payment.getAmount().compareTo(balance) > 0) {
            throw new BadRequestException(
                    "Payment amount " + payment.getAmount()
                            + " exceeds remaining balance " + balance
                            + ". Either pay <= balance, or issue a refund afterwards.");
        }

        payment.setInvoice(invoice);
        payment.setGuestId(guestId);
        payment.setStatus(PaymentStatus.SUCCESS);
        Payment saved = paymentRepository.save(payment);

        // If this payment closes out the balance, mark the invoice PAID.
        BigDecimal newTotalPaid = alreadyPaid.add(payment.getAmount());
        if (newTotalPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoiceRepository.save(invoice);
            log.info("Invoice {} fully PAID (cumulative {})", invoiceId, newTotalPaid);
        } else {
            log.info("Partial payment recorded for invoice {}: paid {} / {}",
                    invoiceId, newTotalPaid, invoice.getTotalAmount());
        }

        return saved;
    }

    /**
     * Updates a payment - limited fields only. Cannot change amount or method on a SUCCESS payment.
     */
    public Payment updatePayment(Long id, Payment updated) {
        Payment existing = getPaymentById(id);
        if (existing.getStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException(
                    "Cannot modify a SUCCESS payment; create a refund instead");
        }
        if (existing.getStatus() == PaymentStatus.REFUNDED) {
            throw new BadRequestException("Cannot modify a REFUNDED payment");
        }
        if (updated.getAmount() != null) existing.setAmount(updated.getAmount());
        if (updated.getMethod() != null) existing.setMethod(updated.getMethod());
        return paymentRepository.save(existing);
    }

    /**
     * Refunds a SUCCESS payment - marks payment REFUNDED and invoice back to UNPAID.
     */
    public Payment refundPayment(Long id) {
        Payment payment = getPaymentById(id);
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException(
                    "Only SUCCESS payments can be refunded; current: " + payment.getStatus());
        }
        payment.setStatus(PaymentStatus.REFUNDED);
        Payment saved = paymentRepository.save(payment);

        // Reconcile the invoice based on remaining successful payments.
        // If still fully covered → stay PAID; if partial → UNPAID; if zero → UNPAID.
        Invoice invoice = payment.getInvoice();
        if (invoice != null && invoice.getStatus() != InvoiceStatus.CANCELLED) {
            BigDecimal remaining = paymentRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
            if (remaining == null) remaining = BigDecimal.ZERO;

            if (remaining.compareTo(invoice.getTotalAmount()) >= 0) {
                invoice.setStatus(InvoiceStatus.PAID);
            } else {
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                    invoice.setStatus(InvoiceStatus.REFUNDED);
                } else {
                    invoice.setStatus(InvoiceStatus.UNPAID);
                }
            }
            invoiceRepository.save(invoice);
        }
        return saved;
    }

    public void deletePayment(Long id) {
        Payment payment = getPaymentById(id);
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException(
                    "Cannot delete a SUCCESS payment; refund it instead");
        }
        paymentRepository.delete(payment);
    }
}
