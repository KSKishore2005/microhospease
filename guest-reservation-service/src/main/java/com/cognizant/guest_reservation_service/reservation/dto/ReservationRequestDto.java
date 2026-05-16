package com.cognizant.guest_reservation_service.reservation.dto;

import com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Request payload for creating or updating a Reservation.
 * Room details (number, type, rate) live in room-service and are fetched via Feign Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequestDto {

    @NotNull(message = "Guest ID is required")
    @Positive(message = "Guest ID must be a positive number")
    private Long guestId;

    @NotNull(message = "Room ID is required")
    @Positive(message = "Room ID must be a positive number")
    private Long roomId;

    @NotNull(message = "Check-in date is required")
    @FutureOrPresent(message = "Check-in date must be today or in the future")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    private ReservationStatus status;

    @Size(max = 500, message = "Special requests must be at most 500 characters")
    private String specialRequests;
}