package com.cognizant.billing.dto;

import com.cognizant.billing.client.dto.GuestDto;
import com.cognizant.billing.entity.Invoice;
import com.cognizant.billing.entity.Payment;
import com.cognizant.billing.enums.InvoiceStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public final class DtoMapper {

    private DtoMapper() {}

    // ─── Invoice ─────────────────────────────────────────────────────────────────

    public static InvoiceResponseDto toInvoiceResponseDto(Invoice invoice) {
        return toInvoiceResponseDto(invoice, null, BigDecimal.ZERO);
    }

    public static InvoiceResponseDto toInvoiceResponseDto(Invoice invoice,
                                                          GuestDto guest,
                                                          BigDecimal amountPaid) {
        if (invoice == null) return null;
        BigDecimal paid = amountPaid != null ? amountPaid : BigDecimal.ZERO;
        BigDecimal balance = (invoice.getStatus() == InvoiceStatus.REFUNDED || invoice.getStatus() == InvoiceStatus.CANCELLED)
                ? BigDecimal.ZERO
                : invoice.getTotalAmount().subtract(paid);
        return InvoiceResponseDto.builder()
                .invoiceId(invoice.getInvoiceId())
                .guestId(invoice.getGuestId())
                .reservationId(invoice.getReservationId())
                .lineItemsJson(invoice.getLineItemsJson())
                .totalAmount(invoice.getTotalAmount())
                .amountPaid(paid)
                .balanceDue(balance)
                .currency(invoice.getCurrency())
                .issuedAt(invoice.getIssuedAt())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .invoiceUri(invoice.getInvoiceUri())
                .guest(guest)
                .build();
    }

    public static Invoice toInvoice(InvoiceRequestDto dto) {
        if (dto == null) return null;
        return Invoice.builder()
                .guestId(dto.getGuestId())
                .reservationId(dto.getReservationId())
                .lineItemsJson(dto.getLineItemsJson())
                .totalAmount(dto.getTotalAmount())
                .currency(dto.getCurrency() != null ? dto.getCurrency() : "USD")
                .dueDate(dto.getDueDate())
                .invoiceUri(dto.getInvoiceUri())
                .status(InvoiceStatus.UNPAID)
                .build();
    }

    public static List<InvoiceResponseDto> toInvoiceResponseDtoList(List<Invoice> invoices) {
        return invoices.stream().map(DtoMapper::toInvoiceResponseDto).collect(Collectors.toList());
    }

    // ─── Payment ─────────────────────────────────────────────────────────────────

    public static PaymentResponseDto toPaymentResponseDto(Payment payment) {
        if (payment == null) return null;
        return PaymentResponseDto.builder()
                .paymentId(payment.getPaymentId())
                .invoiceId(payment.getInvoice() != null ? payment.getInvoice().getInvoiceId() : null)
                .guestId(payment.getGuestId())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .paidAt(payment.getPaidAt())
                .status(payment.getStatus())
                .build();
    }

    public static Payment toPayment(PaymentRequestDto dto) {
        if (dto == null) return null;
        return Payment.builder()
                .amount(dto.getAmount())
                .method(dto.getMethod())
                .build();
    }

    public static List<PaymentResponseDto> toPaymentResponseDtoList(List<Payment> payments) {
        return payments.stream().map(DtoMapper::toPaymentResponseDto).collect(Collectors.toList());
    }
}
