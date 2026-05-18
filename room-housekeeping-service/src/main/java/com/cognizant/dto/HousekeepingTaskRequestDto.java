package com.cognizant.dto;

import com.cognizant.enums.HousekeepingStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HousekeepingTaskRequestDto {

    @NotNull(message = "Room ID is required")
    @Positive(message = "Room ID must be a positive number")
    private Long roomId;

    @Positive(message = "Assigned user ID must be a positive number")
    private Long assignedToUserId;

    private LocalDateTime scheduledAt;
    private LocalDateTime completedAt;
    private HousekeepingStatus status;
}
