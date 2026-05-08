package com.cognizant.hospease.dto;

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
    private LocalDateTime generatedAt;
    private Long generatedByStaffId;
    private String contentSummary;
}