package com.cognizant.hospease.dto;

import com.cognizant.hospease.client.dto.UserDto;
import com.cognizant.hospease.enums.ReportScope;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponseDto {
    private Long reportId;
    private String reportType;
    private ReportScope scope;
    private LocalDateTime generatedAt;
    private Long generatedByStaffId;
    private String contentSummary;
    private String reportUri;
    /** Enriched from user-service. Null if upstream call failed. */
    private UserDto staff;
}
