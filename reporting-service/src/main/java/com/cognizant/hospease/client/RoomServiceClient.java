package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.RoomDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Calls room-housekeeping-service (Eureka name: room-service).
 *
 * <p>Note: room-service does NOT expose /count endpoints; we fetch the full list
 * and compute counts here.
 */
@FeignClient(
        name = "room-service",
        url = "${room-service.url:}"
)
public interface RoomServiceClient {

    @GetMapping("/api/rooms")
    List<RoomDto> getAllRooms();
}
