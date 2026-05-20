package com.cognizant.services_service.dto;

import com.cognizant.services_service.client.dto.GuestDto;
import com.cognizant.services_service.client.dto.RoomDto;
import com.cognizant.services_service.model.ServiceOrderStatus;
import com.cognizant.services_service.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOrderResponseDto {
    private Long orderId;
    private Long guestId;
    private Long reservationId;
    private Long roomId;
    private ServiceType serviceType;
    private String description;
    private BigDecimal price;
    private ServiceOrderStatus status;
    private Long assignedToUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Enriched data fetched from guest-reservation-service.
     * Will be null if the upstream service is unreachable (degrades gracefully).
     */
    private GuestDto guest;

    /**
     * Enriched data fetched from room-housekeeping-service.
     * Will be null if the upstream service is unreachable.
     */
    private RoomDto room;
}
