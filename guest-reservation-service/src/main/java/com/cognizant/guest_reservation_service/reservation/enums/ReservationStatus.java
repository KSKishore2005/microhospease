package com.cognizant.guest_reservation_service.reservation.enums;

/**
 * Lifecycle states of a hotel reservation.
 *
 * Valid transitions:
 *   CONFIRMED → CHECKED_IN → CHECKED_OUT
 *   CONFIRMED → CANCELLED
 *   CHECKED_IN → CANCELLED (early departure)
 */
public enum ReservationStatus {
    CONFIRMED,
    CHECKED_IN,
    CHECKED_OUT,
    CANCELLED
}
