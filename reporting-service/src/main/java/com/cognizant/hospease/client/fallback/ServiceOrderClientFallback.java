package com.cognizant.hospease.client.fallback;

import com.cognizant.hospease.client.ServiceOrderClient;
import com.cognizant.hospease.client.dto.ServiceOrderDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Fallback for ServiceOrderClient.
 * Returns empty list when service-order-service is unreachable or circuit is open.
 */
@Slf4j
@Component
public class ServiceOrderClientFallback implements ServiceOrderClient {

    @Override
    public List<ServiceOrderDto> getAllServiceOrders() {
        log.warn("[FALLBACK] service-order-service unavailable — returning empty service order list");
        return Collections.emptyList();
    }
}
