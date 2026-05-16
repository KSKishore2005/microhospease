package com.cognizant.billing.dto;

import com.cognizant.billing.client.dto.GuestDto;
import com.cognizant.billing.enums.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponseDto {

    private Long invoiceId;
    private Long guestId;
    private Long reservationId;
    private String lineItemsJson;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private String currency;
    private LocalDateTime issuedAt;
    private LocalDate dueDate;
    private InvoiceStatus status;
    private String invoiceUri;

    /** Enriched from guest-reservation-service. Null if upstream call failed. */
    private GuestDto guest;
}
