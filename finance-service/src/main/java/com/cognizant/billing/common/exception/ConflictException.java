package com.cognizant.billing.common.exception;

/**
 * Thrown when a request conflicts with current state - e.g. trying to create
 * a second invoice for a reservation that already has one. Maps to HTTP 409.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
