package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.ReservationDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Calls guest-reservation-service for reservation data
 * (used in occupancy reports).
 */
@FeignClient(
        name = "guest-reservation-service",
        url = "${guest-reservation-service.url:}"
)
public interface ReservationClient {

    @GetMapping("/api/v1/reservations")
    List<ReservationDto> getAllReservations();
}
