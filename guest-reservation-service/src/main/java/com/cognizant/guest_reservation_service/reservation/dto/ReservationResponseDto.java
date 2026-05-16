package com.cognizant.guest_reservation_service.reservation.dto;

import com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response payload for Reservation queries.
 * Includes denormalized guest + room info (room data enriched from room-service via Feign).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponseDto {

    private Long reservationId;
    private Long guestId;
    private String guestName;
    private String guestEmail;

    // Room data — enriched from room-service via Feign
    private Long roomId;
    private String roomNumber;
    private String roomType;
    private BigDecimal ratePerNight;

    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private ReservationStatus status;
    private String specialRequests;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}