package com.cognizant.guest_reservation_service.reservation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * Feign Client for finance-service. Used by ReservationService to auto-generate
 * an invoice the moment a stay completes (CHECKED_OUT).
 *
 * <p>Configure finance-service.url in application.yaml for the no-Eureka fallback.
 *
 * <p>Return type is intentionally {@link Void} — the caller only cares whether
 * the call succeeded. Finance-service's response body (the invoice DTO) is
 * useful only on the finance side and would force this module to depend on its
 * DTO shape.
 */
@FeignClient(
        name = "finance-service",
        url = "${finance-service.url:http://localhost:8086}"
)
public interface FinanceServiceClient {

    /**
     * Triggers invoice generation for the given reservation. Finance-service will:
     * - reject with 409 if an invoice already exists (we treat that as "fine")
     * - reject with 400 if the reservation is CANCELLED (also fine)
     * - 200 with the new invoice on success
     */
    @PostMapping("/api/invoices/generate/{reservationId}")
    Void generateInvoiceForReservation(@PathVariable("reservationId") Long reservationId);
}
