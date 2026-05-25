package com.cognizant.guest_reservation_service.reservation.service;

import com.cognizant.guest_reservation_service.common.exception.BadRequestException;
import com.cognizant.guest_reservation_service.common.exception.ResourceNotFoundException;
import com.cognizant.guest_reservation_service.guest.model.Guest;
import com.cognizant.guest_reservation_service.guest.service.GuestService;
import com.cognizant.guest_reservation_service.reservation.client.FinanceServiceClient;
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
import java.util.Objects;

/**
 * Reservation lifecycle:
 *
 *   PENDING / CONFIRMED  → room stays AVAILABLE (only dates block future bookings)
 *   CHECKED_IN           → room → OCCUPIED
 *   CHECKED_OUT          → room → CLEANING  (housekeeping will set AVAILABLE later)
 *   CANCELLED            → room → AVAILABLE, but ONLY if no other reservation
 *                          currently holds the room (no other guest is CHECKED_IN)
 *
 * The reservation service is the source of truth for *bookings*; the room service is
 * the source of truth for *physical room state*. Room status is synced via Feign as a
 * side-effect of reservation status transitions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final GuestService guestService;
    private final RoomServiceClient roomServiceClient;
    private final FinanceServiceClient financeServiceClient;

    // ─── Read Operations ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getAllReservations() {
        return reservationRepository.findAll().stream()
                .map(this::enrichWithRoomData)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReservationResponseDto getReservationById(Long id) {
        Reservation reservation = getEntityById(id);
        return enrichWithRoomData(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getReservationsByGuest(Long guestId) {
        guestService.findGuestEntityById(guestId);
        return reservationRepository.findByGuest_GuestId(guestId).stream()
                .map(this::enrichWithRoomData)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getReservationsByStatus(ReservationStatus status) {
        return reservationRepository.findByStatus(status).stream()
                .map(this::enrichWithRoomData)
                .toList();
    }

    // ─── Write Operations ─────────────────────────────────────────────────────────

    public ReservationResponseDto createReservation(ReservationRequestDto dto) {
        log.info("Creating reservation for guestId={}, roomId={}", dto.getGuestId(), dto.getRoomId());

        validateDates(dto);

        Guest guest = guestService.findGuestEntityById(dto.getGuestId());
        if (!"ACTIVE".equalsIgnoreCase(guest.getStatus())) {
            throw new BadRequestException(
                    "Cannot create reservation: guest id=" + guest.getGuestId()
                            + " has status '" + guest.getStatus() + "'.");
        }

        // The room must exist and not be under maintenance. A room that is currently
        // OCCUPIED by another guest can still be reserved for a FUTURE date range —
        // the date-overlap check below is the real availability gate.
        RoomDto room = fetchRoom(dto.getRoomId());
        if ("MAINTENANCE".equalsIgnoreCase(room.getStatus())) {
            throw new BadRequestException(
                    "Room " + room.getNumber() + " is under maintenance and cannot be booked.");
        }

        checkRoomConflict(dto.getRoomId(), dto.getCheckInDate(), dto.getCheckOutDate(), null);

        Reservation saved = reservationRepository.save(ReservationMapper.toEntity(dto, guest));
        log.info("Reservation created with id={}, status={}", saved.getResId(), saved.getStatus());

        // NOTE: Do NOT mark room OCCUPIED here. The booking may be for a future date.
        // Room becomes OCCUPIED only when the guest checks in.

        return ReservationMapper.toResponseDto(saved, room);
    }

    public ReservationResponseDto updateReservation(Long id, ReservationRequestDto dto) {
        log.info("Updating reservation id={}", id);

        Reservation existing = getEntityById(id);
        validateDates(dto);

        // Mirror createReservation's guest-status guard: an INACTIVE or
        // SUSPENDED guest cannot reshape their bookings.
        Guest guest = existing.getGuest();
        if (guest != null && guest.getStatus() != null && !"ACTIVE".equalsIgnoreCase(guest.getStatus())) {
            throw new BadRequestException(
                    "Cannot update reservation: guest id=" + guest.getGuestId()
                            + " has status '" + guest.getStatus() + "'.");
        }

        Long oldRoomId = existing.getRoomId();
        boolean roomChanged = !Objects.equals(oldRoomId, dto.getRoomId());

        // Always recheck conflicts for the (possibly new) room and (possibly new) dates,
        // excluding this reservation itself.
        checkRoomConflict(dto.getRoomId(), dto.getCheckInDate(), dto.getCheckOutDate(), id);

        RoomDto newRoom = fetchRoom(dto.getRoomId());
        if (roomChanged && "MAINTENANCE".equalsIgnoreCase(newRoom.getStatus())) {
            throw new BadRequestException(
                    "Room " + newRoom.getNumber() + " is under maintenance.");
        }

        existing.setRoomId(dto.getRoomId());
        existing.setCheckInDate(dto.getCheckInDate());
        existing.setCheckOutDate(dto.getCheckOutDate());
        if (dto.getStatus() != null && dto.getStatus() != existing.getStatus()) {
            validateStatusTransition(existing.getStatus(), dto.getStatus());
            existing.setStatus(dto.getStatus());
        }
        existing.setSpecialRequests(dto.getSpecialRequests());

        Reservation saved = reservationRepository.save(existing);

        // If the room changed AND the guest is currently CHECKED_IN, the old room must
        // be freed (no longer occupied by this guest) and the new one marked OCCUPIED.
        if (roomChanged && saved.getStatus() == ReservationStatus.CHECKED_IN) {
            tryFreeRoomIfNoOtherActiveStay(oldRoomId, saved.getResId());
            safelyUpdateRoomStatus(saved.getRoomId(), "OCCUPIED");
        }

        return ReservationMapper.toResponseDto(saved, newRoom);
    }

    public ReservationResponseDto updateReservationStatus(Long id, ReservationStatus newStatus) {
        log.info("Updating reservation id={} status to {}", id, newStatus);

        Reservation reservation = getEntityById(id);
        ReservationStatus oldStatus = reservation.getStatus();
        validateStatusTransition(oldStatus, newStatus);
        reservation.setStatus(newStatus);

        Reservation saved = reservationRepository.save(reservation);

        // Sync room status based on the new reservation state.
        switch (newStatus) {
            case CHECKED_IN  -> {
                safelyUpdateRoomStatus(reservation.getRoomId(), "OCCUPIED");
                tryGenerateInvoice(reservation.getResId());
            }
            case CHECKED_OUT -> {
                safelyUpdateRoomStatus(reservation.getRoomId(), "CLEANING");
                // Auto-generate the invoice now that the stay is complete. This is
                // fail-soft: if finance-service is down or the invoice already
                // exists, we log it and let the checkout succeed regardless —
                // a stuck check-out is far worse than a missing invoice that the
                // user can re-trigger later from the front-desk UI.
                tryGenerateInvoice(reservation.getResId());
            }
            case CANCELLED   -> {
                // Only free the room if nobody else is currently checked-in to it.
                // (A future-dated CONFIRMED reservation getting cancelled must not
                // free a room that another guest is physically occupying right now.)
                if (oldStatus == ReservationStatus.CHECKED_IN) {
                    safelyUpdateRoomStatus(reservation.getRoomId(), "CLEANING");
                } else {
                    tryFreeRoomIfNoOtherActiveStay(reservation.getRoomId(), saved.getResId());
                }
            }
            default -> { /* PENDING, CONFIRMED — no room status change */ }
        }

        return enrichWithRoomData(saved);
    }

    public void deleteReservation(Long id) {
        Reservation reservation = getEntityById(id);

        if (reservation.getStatus() == ReservationStatus.CHECKED_IN) {
            throw new BadRequestException(
                    "Cannot delete a reservation that is currently CHECKED_IN. Cancel it first.");
        }

        Long roomId = reservation.getRoomId();
        reservationRepository.delete(reservation);
        log.info("Reservation id={} deleted", id);

        // Free the room only if no other active reservation is currently holding it.
        tryFreeRoomIfNoOtherActiveStay(roomId, id);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────────

    private Reservation getEntityById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));
    }

    private RoomDto fetchRoom(Long roomId) {
        try {
            RoomDto room = roomServiceClient.getRoomById(roomId);
            if (room == null) throw new ResourceNotFoundException("Room", "id", roomId);
            return room;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch room id={} from room-service", roomId, e);
            throw new BadRequestException("Room-service unavailable or room not found: " + e.getMessage());
        }
    }

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
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN),
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
        if (current == next) return;

        boolean valid = switch (current) {
            case PENDING     -> next == ReservationStatus.CONFIRMED  || next == ReservationStatus.CANCELLED;
            case CONFIRMED   -> next == ReservationStatus.CHECKED_IN || next == ReservationStatus.CANCELLED;
            case CHECKED_IN  -> next == ReservationStatus.CHECKED_OUT || next == ReservationStatus.CANCELLED;
            case CHECKED_OUT, CANCELLED -> false;
        };
        if (!valid) {
            throw new BadRequestException("Invalid status transition: " + current + " -> " + next);
        }
    }

    /**
     * Frees a room iff no other reservation (excluding the one identified by
     * {@code excludeReservationId}) is currently CHECKED_IN to it.
     */
    private void tryFreeRoomIfNoOtherActiveStay(Long roomId, Long excludeReservationId) {
        boolean someoneStillThere = reservationRepository.findByRoomId(roomId).stream()
                .anyMatch(r -> r.getStatus() == ReservationStatus.CHECKED_IN
                        && !Objects.equals(r.getResId(), excludeReservationId));
        if (!someoneStillThere) {
            safelyUpdateRoomStatus(roomId, "AVAILABLE");
        } else {
            log.info("Skipping AVAILABLE sync for roomId={} — another active stay holds it.", roomId);
        }
    }

    private void safelyUpdateRoomStatus(Long roomId, String status) {
        try {
            roomServiceClient.updateRoomStatus(roomId, status);
        } catch (Exception e) {
            log.warn("Failed to sync room id={} status to {}: {}", roomId, status, e.getMessage());
        }
    }

    /**
     * Asks finance-service to generate the invoice for this completed stay.
     * Fail-soft: a missing invoice doesn't break the checkout. The front-desk
     * "Generate Invoice" button can re-trigger this manually if needed.
     */
    private void tryGenerateInvoice(Long reservationId) {
        try {
            financeServiceClient.generateInvoiceForReservation(reservationId);
            log.info("Auto-generated invoice for reservationId={}", reservationId);
        } catch (feign.FeignException.Conflict already) {
            // Invoice already exists — desired idempotent behaviour, not an error.
            log.info("Invoice already exists for reservationId={}, skipping", reservationId);
        } catch (Exception e) {
            log.warn("Failed to auto-generate invoice for reservationId={}: {}",
                    reservationId, e.getMessage());
        }
    }
}
