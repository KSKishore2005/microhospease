package com.cognizant.services_service.client;

import com.cognizant.services_service.client.dto.RoomDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for room-housekeeping-service (Eureka name: {@code room-service}).
 * <p>
 * Endpoint paths match the actual RoomController in room-housekeeping-service:
 *   - GET /api/rooms/{id}
 */
@FeignClient(
        name = "room-service",
        url = "${room-service.url:}"
)
public interface RoomServiceClient {

    @GetMapping("/api/rooms/{id}")
    RoomDto getRoomById(@PathVariable("id") Long id);
}
