package com.cognizant.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Response DTO for Shift.
 * Key mappings:
 *   entity.shiftId  → dto.id
 *   entity.staff.staffId → dto.staffId
 *   entity.startAt  → dto.startTime (ISO string)
 *   entity.endAt    → dto.endTime   (ISO string)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftResponseDto {
    private Long id;
    private Long staffId;
    private String startTime;
    private String endTime;
    private String shiftType;
    private Long assignedById;
    private String notes;
    private String status;
}
