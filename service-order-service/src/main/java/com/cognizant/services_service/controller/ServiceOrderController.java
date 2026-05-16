package com.cognizant.services_service.controller;

import com.cognizant.services_service.dto.ServiceOrderRequestDto;
import com.cognizant.services_service.dto.ServiceOrderResponseDto;
import com.cognizant.services_service.model.ServiceOrderStatus;
import com.cognizant.services_service.model.ServiceType;
import com.cognizant.services_service.security.RoleRequired;
import com.cognizant.services_service.service.ServiceOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-orders")
@RequiredArgsConstructor
public class ServiceOrderController {

    private final ServiceOrderService serviceOrderService;

    @GetMapping
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<List<ServiceOrderResponseDto>> getAllOrders() {
        return ResponseEntity.ok(serviceOrderService.getAllOrders());
    }

    @GetMapping("/{id}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<ServiceOrderResponseDto> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceOrderService.getOrderById(id));
    }

    @GetMapping("/guest/{guestId}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<List<ServiceOrderResponseDto>> getOrdersByGuestId(@PathVariable Long guestId) {
        return ResponseEntity.ok(serviceOrderService.getOrdersByGuestId(guestId));
    }

    @GetMapping("/reservation/{reservationId}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<List<ServiceOrderResponseDto>> getOrdersByReservationId(
            @PathVariable Long reservationId) {
        return ResponseEntity.ok(serviceOrderService.getOrdersByReservationId(reservationId));
    }

    @GetMapping("/type/{type}")
    @RoleRequired({"FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<ServiceOrderResponseDto>> getOrdersByType(@PathVariable ServiceType type) {
        return ResponseEntity.ok(serviceOrderService.getOrdersByType(type));
    }

    @GetMapping("/status/{status}")
    @RoleRequired({"FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<ServiceOrderResponseDto>> getOrdersByStatus(
            @PathVariable ServiceOrderStatus status) {
        return ResponseEntity.ok(serviceOrderService.getOrdersByStatus(status));
    }

    @PostMapping
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ServiceOrderResponseDto> createOrder(
            @Valid @RequestBody ServiceOrderRequestDto orderDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceOrderService.createOrder(orderDto));
    }

    @PutMapping("/{id}")
    @RoleRequired({"FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ServiceOrderResponseDto> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody ServiceOrderRequestDto orderDto) {
        return ResponseEntity.ok(serviceOrderService.updateOrder(id, orderDto));
    }

    @PatchMapping("/{id}/status")
    @RoleRequired({"FRONT_DESK_STAFF", "RESTAURANT_SERVICE_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ServiceOrderResponseDto> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam ServiceOrderStatus status) {
        return ResponseEntity.ok(serviceOrderService.updateOrderStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        serviceOrderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}