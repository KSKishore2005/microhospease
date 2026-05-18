package com.cognizant.guest_reservation_service.reservation.client;

import com.cognizant.guest_reservation_service.reservation.client.dto.RoomDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Feign Client for room-service.
 * Configure room-service.url in application.yaml if running without Eureka.
 */
@FeignClient(
        name = "room-service",
        url = "${room-service.url:http://localhost:8082}"
)
public interface RoomServiceClient {

    @GetMapping("/api/rooms/{id}")
    RoomDto getRoomById(@PathVariable("id") Long id);

    @GetMapping("/api/rooms/{id}/availability")
    Boolean checkAvailability(@PathVariable("id") Long id,
                              @RequestParam("from") LocalDate from,
                              @RequestParam("to") LocalDate to);

    @PatchMapping("/api/rooms/{id}/status")
    RoomDto updateRoomStatus(@PathVariable("id") Long id,
                             @RequestParam("status") String status);
}