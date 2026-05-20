package com.cognizant.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Request payload for creating / updating a Shift.
 * staffId is also sent as a query param by the frontend; including it here
 * as well means the body alone is self-contained.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRequestDto {
    /**
     * staffId arrives from the frontend's <select> element which always
     * serializes values as JSON strings (e.g. "3").  Storing as String
     * avoids Jackson coercion errors; the controller parses it to Long.
     */
    private String staffId;
    private String startTime;   // ISO datetime "2026-05-20T07:00:00"
    private String endTime;
    private String shiftType;   // MORNING | AFTERNOON | NIGHT
    private String notes;

    /** Convenience — parse staffId string to Long safely. */
    public Long getStaffIdAsLong() {
        if (staffId == null || staffId.isBlank()) return null;
        try { return Long.parseLong(staffId); }
        catch (NumberFormatException e) { return null; }
    }
}
