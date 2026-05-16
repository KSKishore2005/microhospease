package com.cognizant.services_service.common.exception;

/**
 * Thrown when the request is structurally valid but logically invalid:
 * e.g. invalid status transitions, mismatched guest/reservation, inactive guest.
 * Maps to HTTP 400 in the GlobalExceptionHandler.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
