package com.cognizant.services_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Lightweight projection of Reservation from guest-reservation-service.
 * Only fields we need for validation; the upstream service returns more.
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservationDto {
    private Long resId;
    private Long guestId;
    private Long roomId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    /** Upstream enum (CONFIRMED / CHECKED_IN / CHECKED_OUT / CANCELLED) as String. */
    private String status;
}
