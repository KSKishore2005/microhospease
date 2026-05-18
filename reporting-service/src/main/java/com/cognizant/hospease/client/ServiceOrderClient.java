package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.ServiceOrderDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Calls service-order-service for service usage metrics.
 */
@FeignClient(
        name = "service-order-service",
        url = "${service-order-service.url:}"
)
public interface ServiceOrderClient {

    @GetMapping("/api/service-orders")
    List<ServiceOrderDto> getAllServiceOrders();
}
