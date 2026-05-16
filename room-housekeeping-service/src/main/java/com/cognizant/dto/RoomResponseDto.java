package com.cognizant.dto;

import com.cognizant.enums.RoomStatus;
import com.cognizant.enums.RoomType;
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
public class RoomResponseDto {

    private Long roomId;
    private String number;
    private RoomType type;
    private Integer capacity;
    private String amenitiesJson;
    private RoomStatus status;
    private BigDecimal ratePerNight;
    private LocalDateTime createdAt;
}
