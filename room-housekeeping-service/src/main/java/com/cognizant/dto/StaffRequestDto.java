package com.cognizant.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Request payload for creating / updating a Staff member.
 * Field names mirror what the frontend sends via staffApi.create() / staffApi.update().
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffRequestDto {
    private String name;
    private String role;         // e.g. HOUSEKEEPING_STAFF, FRONT_DESK_STAFF …
    private String department;
    private String phone;
    private String email;
    private String hireDate;     // ISO date string "2024-01-15"
    private String status;       // ACTIVE | INACTIVE | ON_LEAVE
}
