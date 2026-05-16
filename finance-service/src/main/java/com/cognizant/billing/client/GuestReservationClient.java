package com.cognizant.billing.client;

import com.cognizant.billing.client.dto.GuestDto;
import com.cognizant.billing.client.dto.ReservationDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Calls guest-reservation-service endpoints.
 * Uses Eureka service name {@code guest-reservation-service}.
 * Falls back to {@code guest-reservation-service.url} if Eureka is not available.
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
