package com.cognizant.guest_reservation_service.guest.service;

import com.cognizant.guest_reservation_service.common.exception.BadRequestException;
import com.cognizant.guest_reservation_service.common.exception.ResourceNotFoundException;
import com.cognizant.guest_reservation_service.guest.dto.GuestRequestDto;
import com.cognizant.guest_reservation_service.guest.dto.GuestResponseDto;
import com.cognizant.guest_reservation_service.guest.mapper.GuestMapper;
import com.cognizant.guest_reservation_service.guest.model.Guest;
import com.cognizant.guest_reservation_service.guest.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for Guest domain operations.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>CRUD operations on {@link Guest}</li>
 *   <li>Email uniqueness enforcement</li>
 *   <li>Loyalty tier and status filtering</li>
 * </ul>
 *
 * <p>No knowledge of Reservation internals – cross-domain queries are
 * delegated to {@link com.cognizant.guest_reservation_service.reservation.service.ReservationService}
 * or handled via the REST layer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GuestService {

    private final GuestRepository guestRepository;

    // ─── Read Operations ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GuestResponseDto> getAllGuests() {
        log.debug("Fetching all guests");
        return guestRepository.findAll().stream()
                .map(GuestMapper::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public GuestResponseDto getGuestById(Long id) {
        log.debug("Fetching guest with id={}", id);
        return guestRepository.findById(id)
                .map(GuestMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Guest", "id", id));
    }

    @Transactional(readOnly = true)
    public GuestResponseDto getGuestByEmail(String email) {
        log.debug("Fetching guest with email={}", email);
        return guestRepository.findByEmailIgnoreCase(email)
                .map(GuestMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Guest", "email", email));
    }

    /**
     * Idempotent "ensure I have a guest profile" helper. Used by the frontend on
     * first guest-area page load: if a profile already exists for this email
     * (case-insensitive), return it; otherwise create a minimal one.
     *
     * <p>Critical: this must NOT throw on the "already exists" race — it's the
     * primary fail-soft path for new guests, and the previous one-shot create
     * approach surfaced unhelpful 400s in the UI.
     */
    /**
     * Idempotent "ensure I have a guest profile" entry point.
     *
     * <p>Runs with {@code Propagation.NOT_SUPPORTED} to explicitly suspend any
     * surrounding transaction (the class-level {@code @Transactional} otherwise
     * wraps every public method). Each {@code guestRepository.X()} call below
     * therefore opens its own implicit per-call transaction. This isolates the
     * failed-save case so a constraint violation cannot poison the session and
     * cause the surface-level Hibernate "null id in Guest entry" error during a
     * subsequent retry-read.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public GuestResponseDto upsertByEmail(String name, String email, String phone) {
        log.info("Upserting guest profile for email={}", email);

        if (name == null || name.isBlank()) {
            throw new BadRequestException("Guest name is required for profile creation.");
        }
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required for profile creation.");
        }

        // Each repository call below runs in its own implicit transaction because
        // the surrounding @Transactional was suspended by NOT_SUPPORTED above.
        Optional<Guest> existing = guestRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            return GuestMapper.toResponseDto(existing.get());
        }

        try {
            Guest entity = Guest.builder()
                    .name(name)
                    .email(email)
                    .phone(phone != null && phone.length() >= 7 && phone.length() <= 20 ? phone : null)
                    .loyaltyTier("STANDARD")
                    .status("ACTIVE")
                    .build();
            Guest saved = guestRepository.save(entity);
            log.info("Upsert created new guest id={} for email={}", saved.getGuestId(), email);
            return GuestMapper.toResponseDto(saved);
        } catch (Exception ex) {
            // Any failure on save (constraint race, poisoned session from a prior
            // request, dialect mismatch, etc.) — fall back to a fresh read. If a
            // concurrent insert succeeded, we'll find that row and return it. If
            // truly nothing is there, surface a clean BadRequest with the original
            // message so the frontend can show something useful.
            log.warn("Upsert save failed for email={} ({}), refetching",
                    email, ex.getMessage());
            return guestRepository.findByEmailIgnoreCase(email)
                    .map(GuestMapper::toResponseDto)
                    .orElseThrow(() -> new BadRequestException(
                            "Could not create or find guest profile for " + email
                                    + ". Root cause: " + ex.getMessage()));
        }
    }

    @Transactional(readOnly = true)
    public List<GuestResponseDto> getGuestsByLoyaltyTier(String tier) {
        log.debug("Fetching guests with loyaltyTier={}", tier);
        return guestRepository.findByLoyaltyTier(tier).stream()
                .map(GuestMapper::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuestResponseDto> getGuestsByStatus(String status) {
        log.debug("Fetching guests with status={}", status);
        return guestRepository.findByStatus(status).stream()
                .map(GuestMapper::toResponseDto)
                .toList();
    }

    // ─── Write Operations ─────────────────────────────────────────────────────────

    public GuestResponseDto createGuest(GuestRequestDto dto) {
        log.info("Creating new guest with email={}", dto.getEmail());

        if (guestRepository.existsByEmailIgnoreCase(dto.getEmail())) {
            throw new BadRequestException(
                    "A guest with email '" + dto.getEmail() + "' already exists.");
        }

        Guest saved = guestRepository.save(GuestMapper.toEntity(dto));
        log.info("Guest created with guestId={}", saved.getGuestId());
        return GuestMapper.toResponseDto(saved);
    }

    public GuestResponseDto updateGuest(Long id, GuestRequestDto dto) {
        log.info("Updating guest with id={}", id);

        Guest existing = guestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guest", "id", id));

        // If email changed, ensure the new email is not taken by another guest.
        // Email uniqueness is enforced case-insensitively to match repository semantics.
        if (!existing.getEmail().equalsIgnoreCase(dto.getEmail())
                && guestRepository.existsByEmailIgnoreCase(dto.getEmail())) {
            throw new BadRequestException(
                    "Email '" + dto.getEmail() + "' is already in use by another guest.");
        }

        GuestMapper.updateEntity(existing, dto);
        return GuestMapper.toResponseDto(guestRepository.save(existing));
    }

    public void deleteGuest(Long id) {
        log.info("Deleting guest with id={}", id);
        Guest guest = guestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guest", "id", id));

        // Refuse if the guest still has active reservations — deletion would
        // orphan room occupancy state, invoices, and audit trail.
        boolean hasActive = guest.getReservations() != null && guest.getReservations().stream()
                .anyMatch(r ->
                        r.getStatus() == com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus.PENDING
                     || r.getStatus() == com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus.CONFIRMED
                     || r.getStatus() == com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus.CHECKED_IN);
        if (hasActive) {
            throw new BadRequestException(
                    "Cannot delete guest " + id + " — they have active reservations. "
                            + "Cancel or check-out all reservations first.");
        }

        guestRepository.delete(guest);
        log.info("Guest id={} deleted", id);
    }

    // ─── Internal Helper (package-visible for Reservation service use) ────────────

    /**
     * Returns the managed {@link Guest} entity by ID.
     * Used by {@link com.cognizant.guest_reservation_service.reservation.service.ReservationService}
     * to link a guest to a reservation via service-layer call (no direct repo access).
     *
     * <p>Future microservice split: replace this with a Feign client call.
     */
    @Transactional(readOnly = true)
    public Guest findGuestEntityById(Long id) {
        return guestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guest", "id", id));
    }
}
