package com.cognizant.services_service.client;

import com.cognizant.services_service.client.dto.GuestDto;
import com.cognizant.services_service.client.dto.ReservationDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for guest-reservation-service.
 * <p>
 * Resolves via Eureka by the service name {@code guest-reservation-service}.
 * Falls back to {@code guest-reservation-service.url} (application.yml) if Eureka can't resolve it.
 * <p>
 * Endpoint paths match the actual controllers in guest-reservation-service:
 *   - GET /api/v1/guests/{id}
 *   - GET /api/v1/reservations/{id}
 */
@FeignClient(
        name = "guest-reservation-service",
        url = "${guest-reservation-service.url:}"
)
public interface GuestReservationClient {

    @GetMapping("/api/v1/guests/{id}")
    GuestDto getGuestById(@PathVariable("id") Long id);

    @GetMapping("/api/v1/reservations/{id}")
    ReservationDto getReservationById(@PathVariable("id") Long id);
}
