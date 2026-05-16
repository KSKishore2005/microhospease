package com.cognizant.guest_reservation_service.reservation.mapper;

import com.cognizant.guest_reservation_service.guest.model.Guest;
import com.cognizant.guest_reservation_service.reservation.client.dto.RoomDto;
import com.cognizant.guest_reservation_service.reservation.dto.ReservationRequestDto;
import com.cognizant.guest_reservation_service.reservation.dto.ReservationResponseDto;
import com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus;
import com.cognizant.guest_reservation_service.reservation.model.Reservation;
import lombok.experimental.UtilityClass;

/**
 * Stateless utility for mapping between Reservation entity and its DTOs.
 * Room data comes from room-service via Feign (RoomDto).
 */
@UtilityClass
public class ReservationMapper {

    public Reservation toEntity(ReservationRequestDto dto, Guest guest) {
        return Reservation.builder()
                .guest(guest)
                .roomId(dto.getRoomId())
                .checkInDate(dto.getCheckInDate())
                .checkOutDate(dto.getCheckOutDate())
                .status(dto.getStatus() != null ? dto.getStatus() : ReservationStatus.CONFIRMED)
                .specialRequests(dto.getSpecialRequests())
                .build();
    }

    /**
     * Maps entity → DTO without room enrichment (room fields will be null).
     */
    public ReservationResponseDto toResponseDto(Reservation reservation) {
        return toResponseDto(reservation, null);
    }

    /**
     * Maps entity → DTO with room enrichment from RoomDto (fetched via Feign).
     */
    public ReservationResponseDto toResponseDto(Reservation reservation, RoomDto room) {
        if (reservation == null) return null;

        Guest guest = reservation.getGuest();
        return ReservationResponseDto.builder()
                .reservationId(reservation.getResId())
                .guestId(guest != null ? guest.getGuestId() : null)
                .guestName(guest != null ? guest.getName() : null)
                .guestEmail(guest != null ? guest.getEmail() : null)
                .roomId(reservation.getRoomId())
                .roomNumber(room != null ? room.getNumber() : null)
                .roomType(room != null ? room.getType() : null)
                .ratePerNight(room != null ? room.getRatePerNight() : null)
                .checkInDate(reservation.getCheckInDate())
                .checkOutDate(reservation.getCheckOutDate())
                .status(reservation.getStatus())
                .specialRequests(reservation.getSpecialRequests())
                .createdAt(reservation.getCreatedAt())
                .modifiedAt(reservation.getModifiedAt())
                .build();
    }
}