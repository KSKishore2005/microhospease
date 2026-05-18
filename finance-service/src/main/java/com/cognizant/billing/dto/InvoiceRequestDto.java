package com.cognizant.billing.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Manual invoice request. Status is NOT in this DTO — new invoices always start UNPAID.
 * Status changes go through PATCH endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequestDto {

    @NotNull(message = "Guest ID is required")
    @Positive(message = "Guest ID must be positive")
    private Long guestId;

    @Positive(message = "Reservation ID must be positive")
    private Long reservationId;

    @Size(max = 5000, message = "lineItemsJson must be at most 5000 characters")
    private String lineItemsJson;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Total amount must have at most 10 integer and 2 decimal digits")
    private BigDecimal totalAmount;

    @Builder.Default
    @Size(max = 10, message = "currency code too long")
    private String currency = "USD";

    @NotNull(message = "Due date is required")
    @FutureOrPresent(message = "Due date must be today or in the future")
    private LocalDate dueDate;

    private String invoiceUri;
}
