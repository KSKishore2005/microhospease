package com.cognizant.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Response DTO for Staff — maps entity fields to what the frontend expects.
 * Key mapping: entity.staffId → dto.id
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffResponseDto {
    private Long id;          // entity.staffId
    private Long userId;
    private String name;
    private String role;
    private String department;
    private String phone;
    private String email;
    private String hireDate;
    private String status;
}
