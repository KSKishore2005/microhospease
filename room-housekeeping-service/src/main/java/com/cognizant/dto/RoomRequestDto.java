package com.cognizant.dto;

import com.cognizant.enums.RoomStatus;
import com.cognizant.enums.RoomType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequestDto {

    @NotBlank(message = "Room number is required")
    @Size(max = 50, message = "Room number must be at most 50 characters")
    private String number;

    @NotNull(message = "Room type is required")
    private RoomType type;

    @NotNull(message = "Room capacity is required")
    @Positive(message = "Room capacity must be a positive number")
    private Integer capacity;

    @Size(max = 4000, message = "Amenities must be at most 4000 characters")
    private String amenitiesJson;

    @NotNull(message = "Room status is required")
    private RoomStatus status;

    @NotNull(message = "Rate per night is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rate per night must be greater than zero")
    private BigDecimal ratePerNight;
}
