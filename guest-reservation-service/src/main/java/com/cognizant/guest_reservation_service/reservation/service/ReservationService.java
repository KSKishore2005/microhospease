package com.cognizant.guest_reservation_service.reservation.service;

import      com.cognizant.guest_reservation_service.common.exception.BadRequestException;
import com.cognizant.guest_reservation_service.common.exception.ResourceNotFoundException;
import com.cognizant.guest_reservation_service.guest.model.Guest;
import com.cognizant.guest_reservation_service.guest.service.GuestService;
import com.cognizant.guest_reservation_service.reservation.client.RoomServiceClient;
import com.cognizant.guest_reservation_service.reservation.client.dto.RoomDto;
import com.cognizant.guest_reservation_service.reservation.dto.ReservationRequestDto;
import com.cognizant.guest_reservation_service.reservation.dto.ReservationResponseDto;
import com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus;
import com.cognizant.guest_reservation_service.reservation.mapper.ReservationMapper;
import com.cognizant.guest_reservation_service.reservation.model.Reservation;
import com.cognizant.guest_reservation_service.reservation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final GuestService guestService;
    private final RoomServiceClient roomServiceClient;   // ← Feign Client

    // ─── Read Operations ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getAllReservations() {
        log.debug("Fetching all reservations");
        return reservationRepository.findAll().stream()
                .map(this::enrichWithRoomData)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReservationResponseDto getReservationById(Long id) {
        log.debug("Fetching reservation id={}", id);
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));
        return enrichWithRoomData(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getReservationsByGuest(Long guestId) {
        log.debug("Fetching reservations for guestId={}", guestId);
        guestService.findGuestEntityById(guestId);
        return reservationRepository.findByGuest_GuestId(guestId).stream()
                .map(this::enrichWithRoomData)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getReservationsByStatus(ReservationStatus status) {
        log.debug("Fetching reservations with status={}", status);
        return reservationRepository.findByStatus(status).stream()
                .map(this::enrichWithRoomData)
                .toList();
    }

    // ─── Write Operations ─────────────────────────────────────────────────────────

    public ReservationResponseDto createReservation(ReservationRequestDto dto) {
        log.info("Creating reservation for guestId={}, roomId={}", dto.getGuestId(), dto.getRoomId());

        validateDates(dto);

        // Resolve guest
        Guest guest = guestService.findGuestEntityById(dto.getGuestId());

        if (!"ACTIVE".equalsIgnoreCase(guest.getStatus())) {
            throw new BadRequestException(
                    "Cannot create reservation: guest id=" + guest.getGuestId()
                            + " has status '" + guest.getStatus() + "'.");
        }

        // Fetch room from room-service via Feign
        RoomDto room = fetchRoom(dto.getRoomId());

        if (!"AVAILABLE".equalsIgnoreCase(room.getStatus())) {
            throw new BadRequestException("Room " + room.getNumber() + " is not available.");
        }

        // Check room conflicts in our own DB
        checkRoomConflict(dto.getRoomId(), dto.getCheckInDate(), dto.getCheckOutDate(), null);

        // Save
        Reservation saved = reservationRepository.save(ReservationMapper.toEntity(dto, guest));
        log.info("Reservation created with id={}", saved.getResId());

        // Optionally update room status to OCCUPIED in room-service
        try {
            roomServiceClient.updateRoomStatus(dto.getRoomId(), "OCCUPIED");
        } catch (Exception e) {
            log.warn("Failed to update room status in room-service: {}", e.getMessage());
        }

        return ReservationMapper.toResponseDto(saved, room);
    }

    public ReservationResponseDto updateReservation(Long id, ReservationRequestDto dto) {
        log.info("Updating reservation id={}", id);

        Reservation existing = getEntityById(id);
        validateDates(dto);
        checkRoomConflict(dto.getRoomId(), dto.getCheckInDate(), dto.getCheckOutDate(), id);

        // Verify new room exists if changed
        RoomDto room = fetchRoom(dto.getRoomId());

        existing.setRoomId(dto.getRoomId());
        existing.setCheckInDate(dto.getCheckInDate());
        existing.setCheckOutDate(dto.getCheckOutDate());
        if (dto.getStatus() != null) existing.setStatus(dto.getStatus());
        existing.setSpecialRequests(dto.getSpecialRequests());

        Reservation saved = reservationRepository.save(existing);
        return ReservationMapper.toResponseDto(saved, room);
    }

    public ReservationResponseDto updateReservationStatus(Long id, ReservationStatus newStatus) {
        log.info("Updating reservation id={} status to {}", id, newStatus);

        Reservation reservation = getEntityById(id);
        validateStatusTransition(reservation.getStatus(), newStatus);
        reservation.setStatus(newStatus);

        Reservation saved = reservationRepository.save(reservation);

        // Sync room status with room-service
        try {
            if (newStatus == ReservationStatus.CHECKED_OUT || newStatus == ReservationStatus.CANCELLED) {
                roomServiceClient.updateRoomStatus(reservation.getRoomId(), "AVAILABLE");
            } else if (newStatus == ReservationStatus.CHECKED_IN) {
                roomServiceClient.updateRoomStatus(reservation.getRoomId(), "OCCUPIED");
            }
        } catch (Exception e) {
            log.warn("Failed to sync room status to room-service: {}", e.getMessage());
        }

        return enrichWithRoomData(saved);
    }

    public void deleteReservation(Long id) {
        log.info("Deleting reservation id={}", id);
        Reservation reservation = getEntityById(id);

        if (reservation.getStatus() == ReservationStatus.CHECKED_IN) {
            throw new BadRequestException(
                    "Cannot delete a reservation that is currently CHECKED_IN. Cancel it first.");
        }

        reservationRepository.delete(reservation);
        log.info("Reservation id={} deleted", id);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────────

    private Reservation getEntityById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));
    }

    private RoomDto fetchRoom(Long roomId) {
        try {
            RoomDto room = roomServiceClient.getRoomById(roomId);
            if (room == null) {
                throw new ResourceNotFoundException("Room", "id", roomId);
            }
            return room;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch room id={} from room-service", roomId, e);
            throw new BadRequestException("Room-service unavailable or room not found: " + e.getMessage());
        }
    }

    /**
     * Enriches a Reservation entity into a ResponseDto by fetching room data via Feign.
     * If room-service is down, room fields will be null (degrades gracefully).
     */
    private ReservationResponseDto enrichWithRoomData(Reservation reservation) {
        RoomDto room = null;
        try {
            room = roomServiceClient.getRoomById(reservation.getRoomId());
        } catch (Exception e) {
            log.warn("Could not enrich room data for roomId={}: {}",
                    reservation.getRoomId(), e.getMessage());
        }
        return ReservationMapper.toResponseDto(reservation, room);
    }

    private void validateDates(ReservationRequestDto dto) {
        if (dto.getCheckInDate() == null || dto.getCheckOutDate() == null) {
            throw new BadRequestException("Check-in and check-out dates are required.");
        }
        if (!dto.getCheckOutDate().isAfter(dto.getCheckInDate())) {
            throw new BadRequestException("Check-out date must be after check-in date.");
        }
    }

    private void checkRoomConflict(Long roomId, LocalDate checkIn, LocalDate checkOut,
                                   Long excludeReservationId) {
        List<Reservation> conflicts = reservationRepository.findConflicting(
                roomId,
                List.of(ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN),
                checkIn, checkOut);

        boolean hasConflict = conflicts.stream()
                .anyMatch(r -> excludeReservationId == null
                        || !r.getResId().equals(excludeReservationId));

        if (hasConflict) {
            throw new BadRequestException(
                    "Room ID " + roomId + " is already booked for the selected dates.");
        }
    }

    private void validateStatusTransition(ReservationStatus current, ReservationStatus next) {
        boolean valid;
        if (current == ReservationStatus.CONFIRMED) {
            valid = next == ReservationStatus.CHECKED_IN || next == ReservationStatus.CANCELLED;
        } else if (current == ReservationStatus.CHECKED_IN) {
            valid = next == ReservationStatus.CHECKED_OUT || next == ReservationStatus.CANCELLED;
        } else {
            valid = false;
        }

        if (!valid) {
            throw new BadRequestException(
                    "Invalid status transition: " + current + " -> " + next);
        }
    }
}