package com.cognizant.user_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequestDTO {

    private Long userId;
    private String action;
    private String resourceType;
    private String resourceId;   // String – frontend sends IDs as strings
    private String detailsJson;
}
