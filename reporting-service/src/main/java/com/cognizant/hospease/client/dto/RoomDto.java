package com.cognizant.hospease.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoomDto {
    private Long roomId;
    private String number;
    private String type;
    private Integer capacity;
    /** AVAILABLE / OCCUPIED / MAINTENANCE */
    private String status;
    private BigDecimal ratePerNight;
}
