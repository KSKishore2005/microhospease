package com.cognizant.guest_reservation_service.guest.controller;

import com.cognizant.guest_reservation_service.guest.dto.GuestRequestDto;
import com.cognizant.guest_reservation_service.guest.dto.GuestResponseDto;
import com.cognizant.guest_reservation_service.guest.service.GuestService;
import com.cognizant.guest_reservation_service.security.RoleRequired;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Guest management.
 */
@RestController
@RequestMapping("/api/v1/guests")
@RequiredArgsConstructor
public class GuestController {

    private final GuestService guestService;

    @GetMapping
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<GuestResponseDto>> getAllGuests() {
        return ResponseEntity.ok(guestService.getAllGuests());
    }

    @GetMapping("/{id}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER", "RESTAURANT_SERVICE_STAFF"})
    public ResponseEntity<GuestResponseDto> getGuestById(@PathVariable Long id) {
        return ResponseEntity.ok(guestService.getGuestById(id));
    }

    @GetMapping("/email/{email}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<GuestResponseDto> getGuestByEmail(@PathVariable String email) {
        return ResponseEntity.ok(guestService.getGuestByEmail(email));
    }

    @GetMapping("/loyalty/{tier}")
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<List<GuestResponseDto>> getGuestsByLoyaltyTier(@PathVariable String tier) {
        return ResponseEntity.ok(guestService.getGuestsByLoyaltyTier(tier));
    }

    @GetMapping("/status/{status}")
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<List<GuestResponseDto>> getGuestsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(guestService.getGuestsByStatus(status));
    }

    @PostMapping
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<GuestResponseDto> createGuest(
            @Valid @RequestBody GuestRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(guestService.createGuest(requestDto));
    }

    /**
     * Idempotent "ensure my profile exists" endpoint. Returns the existing guest
     * by email (case-insensitive) or creates a minimal one — never errors out
     * on "already exists". Used by the frontend on first guest-area page load.
     */
    @PostMapping("/upsert")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<GuestResponseDto> upsertGuest(
            @Valid @RequestBody GuestRequestDto requestDto) {
        return ResponseEntity.ok(guestService.upsertByEmail(
                requestDto.getName(),
                requestDto.getEmail(),
                requestDto.getPhone()));
    }

    @PutMapping("/{id}")
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<GuestResponseDto> updateGuest(
            @PathVariable Long id,
            @Valid @RequestBody GuestRequestDto requestDto) {
        return ResponseEntity.ok(guestService.updateGuest(id, requestDto));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deleteGuest(@PathVariable Long id) {
        guestService.deleteGuest(id);
        return ResponseEntity.noContent().build();
    }
}