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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        return guestRepository.findByEmail(email)
                .map(GuestMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Guest", "email", email));
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

        if (guestRepository.existsByEmail(dto.getEmail())) {
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

        // If email changed, ensure the new email is not taken by another guest
        if (!existing.getEmail().equalsIgnoreCase(dto.getEmail())
                && guestRepository.existsByEmail(dto.getEmail())) {
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
