package com.cognizant.guest_reservation_service.reservation.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Local mirror of room-service's Room response.
 * Field names must match exactly what room-service returns.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
    private Long roomId;
    private String number;
    private String type;
    private Integer capacity;
    private String status;          // AVAILABLE / OCCUPIED / MAINTENANCE
    private BigDecimal ratePerNight;
}