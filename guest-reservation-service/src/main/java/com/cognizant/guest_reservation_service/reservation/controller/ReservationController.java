package com.cognizant.guest_reservation_service.reservation.controller;

import com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus;
import com.cognizant.guest_reservation_service.reservation.dto.ReservationRequestDto;
import com.cognizant.guest_reservation_service.reservation.dto.ReservationResponseDto;
import com.cognizant.guest_reservation_service.reservation.service.ReservationService;
import com.cognizant.guest_reservation_service.security.RoleRequired;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Reservation management.
 */
@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<ReservationResponseDto>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @GetMapping("/{id}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER", "RESTAURANT_SERVICE_STAFF", "HOUSEKEEPING_STAFF"})
    public ResponseEntity<ReservationResponseDto> getReservationById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @GetMapping("/guest/{guestId}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<List<ReservationResponseDto>> getReservationsByGuest(
            @PathVariable Long guestId) {
        return ResponseEntity.ok(reservationService.getReservationsByGuest(guestId));
    }

    @GetMapping("/status/{status}")
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<List<ReservationResponseDto>> getReservationsByStatus(
            @PathVariable ReservationStatus status) {
        return ResponseEntity.ok(reservationService.getReservationsByStatus(status));
    }

    @PostMapping
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ReservationResponseDto> createReservation(
            @Valid @RequestBody ReservationRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservationService.createReservation(requestDto));
    }

    @PutMapping("/{id}")
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ReservationResponseDto> updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody ReservationRequestDto requestDto) {
        return ResponseEntity.ok(reservationService.updateReservation(id, requestDto));
    }

    @PatchMapping("/{id}/status")
    @RoleRequired({"FRONT_DESK_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ReservationResponseDto> updateReservationStatus(
            @PathVariable Long id,
            @RequestParam ReservationStatus status) {
        return ResponseEntity.ok(reservationService.updateReservationStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }
}