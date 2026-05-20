package com.cognizant.services_service.mapper;

import com.cognizant.services_service.client.dto.GuestDto;
import com.cognizant.services_service.client.dto.RoomDto;
import com.cognizant.services_service.dto.ServiceOrderRequestDto;
import com.cognizant.services_service.dto.ServiceOrderResponseDto;
import com.cognizant.services_service.model.ServiceOrder;
import com.cognizant.services_service.model.ServiceOrderStatus;

public final class ServiceOrderMapper {

    private ServiceOrderMapper() {}

    /** Map entity → response DTO without enriched data. */
    public static ServiceOrderResponseDto toResponseDto(ServiceOrder o) {
        return toResponseDto(o, null, null);
    }

    /** Map entity → response DTO with optional enriched guest and room data. */
    public static ServiceOrderResponseDto toResponseDto(ServiceOrder o,
                                                        GuestDto guest,
                                                        RoomDto room) {
        if (o == null) return null;
        return ServiceOrderResponseDto.builder()
                .orderId(o.getOrderId())
                .guestId(o.getGuestId())
                .reservationId(o.getReservationId())
                .roomId(o.getRoomId())
                .serviceType(o.getServiceType())
                .description(o.getDescription())
                .price(o.getPrice())
                .status(o.getStatus())
                .assignedToUserId(o.getAssignedToUserId())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .guest(guest)
                .room(room)
                .build();
    }

    /** Map create-request DTO → new entity. Status is server-controlled (set in service layer). */
    public static ServiceOrder toEntity(ServiceOrderRequestDto dto) {
        if (dto == null) return null;
        return ServiceOrder.builder()
                .guestId(dto.getGuestId())
                .reservationId(dto.getReservationId())
                .roomId(dto.getRoomId())
                .serviceType(dto.getServiceType())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .status(ServiceOrderStatus.PENDING)
                .build();
    }
}
