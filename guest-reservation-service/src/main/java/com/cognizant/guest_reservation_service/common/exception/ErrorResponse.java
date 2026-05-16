package com.cognizant.guest_reservation_service.common.exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standardized error response envelope returned by the GlobalExceptionHandler.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    /** HTTP status code (e.g. 400, 404, 500). */
    private int status;

    /** Short error label (e.g. "Not Found", "Bad Request"). */
    private String error;

    /** Developer-friendly message explaining what went wrong. */
    private String message;

    /** Request URI that triggered the error. */
    private String path;

    /** Timestamp when the error occurred. */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
