package com.cognizant.dto;

import com.cognizant.enums.HousekeepingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HousekeepingTaskResponseDto {

    private Long taskId;
    private Long roomId;
    private Long assignedToUserId;
    private LocalDateTime scheduledAt;
    private LocalDateTime completedAt;
    private HousekeepingStatus status;
}
