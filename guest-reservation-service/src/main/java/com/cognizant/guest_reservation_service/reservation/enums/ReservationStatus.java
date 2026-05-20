package com.cognizant.guest_reservation_service.reservation.enums;

/**
 * Lifecycle states of a hotel reservation.
 *
 * Valid transitions:
 *   PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT
 *   PENDING → CANCELLED
 *   CONFIRMED → CANCELLED
 *   CHECKED_IN → CANCELLED (early departure)
 */
public enum ReservationStatus {
    PENDING,
    CONFIRMED,
    CHECKED_IN,
    CHECKED_OUT,
    CANCELLED
}
