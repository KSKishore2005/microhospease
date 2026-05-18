package com.cognizant.services_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Lightweight projection of Room from room-housekeeping-service.
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoomDto {
    private Long roomId;
    private String number;
    private String type;
    private Integer capacity;
    private String amenitiesJson;
    private String status;
    private BigDecimal ratePerNight;
}
