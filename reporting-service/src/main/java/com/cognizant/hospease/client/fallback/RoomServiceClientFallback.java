package com.cognizant.hospease.client.fallback;

import com.cognizant.hospease.client.RoomServiceClient;
import com.cognizant.hospease.client.dto.RoomDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Fallback for RoomServiceClient.
 * Returns empty list when room-service is unreachable or circuit is open.
 */
@Slf4j
@Component
public class RoomServiceClientFallback implements RoomServiceClient {

    @Override
    public List<RoomDto> getAllRooms() {
        log.warn("[FALLBACK] room-service unavailable — returning empty room list");
        return Collections.emptyList();
    }
}
