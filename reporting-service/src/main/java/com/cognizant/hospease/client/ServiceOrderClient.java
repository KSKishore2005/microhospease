package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.ServiceOrderDto;
import com.cognizant.hospease.client.fallback.ServiceOrderClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Calls service-order-service for service usage metrics.
 * Falls back to ServiceOrderClientFallback when the circuit is open or the service is unreachable.
 */
@FeignClient(
        name = "service-order-service",
        url = "${service-order-service.url:}",
        fallback = ServiceOrderClientFallback.class
)
public interface ServiceOrderClient {

    @GetMapping("/api/service-orders")
    List<ServiceOrderDto> getAllServiceOrders();
}
