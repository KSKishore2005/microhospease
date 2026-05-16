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
     * STRICT payment: amount must equal the invoice's remaining balance.
     * On success, marks invoice PAID and payment SUCCESS.
     */
    public Payment createPayment(Payment payment, Long invoiceId, Long guestId) {
        log.info("Creating payment for invoiceId={}, guestId={}, amount={}",
                invoiceId, guestId, payment.getAmount());

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        // Block payments on terminal invoice states
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Invoice " + invoiceId + " is already PAID");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay a CANCELLED invoice");
        }

        // Guest must match the invoice's guest
        if (!invoice.getGuestId().equals(guestId)) {
            throw new BadRequestException(
                    "Guest " + guestId + " does not own invoice " + invoiceId
                            + " (owned by guest " + invoice.getGuestId() + ")");
        }

        // STRICT match: payment amount must equal remaining balance
        BigDecimal alreadyPaid = paymentRepository.sumSuccessfulPaymentsForInvoice(invoiceId);
        BigDecimal balance = invoice.getTotalAmount().subtract(alreadyPaid);

        if (payment.getAmount().compareTo(balance) != 0) {
            throw new BadRequestException(
                    "Payment amount " + payment.getAmount()
                            + " does not match remaining balance " + balance
                            + " (totalAmount=" + invoice.getTotalAmount()
                            + ", alreadyPaid=" + alreadyPaid + ")");
        }

        payment.setInvoice(invoice);
        payment.setGuestId(guestId);
        payment.setStatus(PaymentStatus.SUCCESS);

        // Mark invoice paid
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        Payment saved = paymentRepository.save(payment);
        log.info("Payment created id={}, invoice {} marked PAID", saved.getPaymentId(), invoiceId);
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

        Invoice invoice = payment.getInvoice();
        if (invoice != null) {
            invoice.setStatus(InvoiceStatus.UNPAID);
            invoiceRepository.save(invoice);
        }
        return paymentRepository.save(payment);
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
