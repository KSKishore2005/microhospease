package com.cognizant.services_service.dto;

import com.cognizant.services_service.model.ServiceType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for creating or updating a ServiceOrder.
 * <p>
 * Note: {@code status} is NOT in this DTO. Status is server-controlled:
 * - New orders always start as PENDING
 * - Status changes go through PATCH /api/service-orders/{id}/status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOrderRequestDto {

    @NotNull(message = "guestId is required")
    @Positive(message = "guestId must be positive")
    private Long guestId;

    @NotNull(message = "reservationId is required")
    @Positive(message = "reservationId must be positive")
    private Long reservationId;

    @NotNull(message = "roomId is required")
    @Positive(message = "roomId must be positive")
    private Long roomId;

    @NotNull(message = "serviceType is required")
    private ServiceType serviceType;

    @Size(max = 500, message = "description must be at most 500 characters")
    private String description;

    @NotNull(message = "price is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "price must be >= 0")
    @Digits(integer = 10, fraction = 2, message = "price must have at most 10 integer digits and 2 decimal digits")
    private BigDecimal price;
}
