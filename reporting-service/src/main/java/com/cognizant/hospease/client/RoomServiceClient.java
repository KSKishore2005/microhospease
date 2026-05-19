package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.RoomDto;
import com.cognizant.hospease.client.fallback.RoomServiceClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Calls room-housekeeping-service (Eureka name: room-service).
 *
 * <p>Note: room-service does NOT expose /count endpoints; we fetch the full list
 * and compute counts here.
 * Falls back to RoomServiceClientFallback when the circuit is open or the service is unreachable.
 */
@FeignClient(
        name = "room-service",
        url = "${room-service.url:}",
        fallback = RoomServiceClientFallback.class
)
public interface RoomServiceClient {

    @GetMapping("/api/rooms")
    List<RoomDto> getAllRooms();
}
