package com.cognizant.user_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponseDTO {

    private Long auditId;
    private Long userId;
    private String userName;
    private String action;
    private String resourceType;
    private Long resourceId;
    private String detailsJson;
    private LocalDateTime timestamp;
}
