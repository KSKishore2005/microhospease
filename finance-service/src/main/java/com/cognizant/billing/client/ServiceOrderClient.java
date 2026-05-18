package com.cognizant.billing.client;

import com.cognizant.billing.client.dto.ServiceOrderDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Calls service-order-service.
 * Endpoint path matches ServiceOrderController in service-order-service.
 */
@FeignClient(
        name = "service-order-service",
        url = "${service-order-service.url:}"
)
public interface ServiceOrderClient {

    @GetMapping("/api/service-orders/reservation/{reservationId}")
    List<ServiceOrderDto> getOrdersByReservationId(@PathVariable("reservationId") Long reservationId);
}
