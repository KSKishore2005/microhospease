package com.cognizant.hospease.client.fallback;

import com.cognizant.hospease.client.ReservationClient;
import com.cognizant.hospease.client.dto.ReservationDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Fallback for ReservationClient.
 * Returns empty list when guest-reservation-service is unreachable or circuit is open.
 */
@Slf4j
@Component
public class ReservationClientFallback implements ReservationClient {

    @Override
    public List<ReservationDto> getAllReservations() {
        log.warn("[FALLBACK] guest-reservation-service unavailable — returning empty reservation list");
        return Collections.emptyList();
    }
}
