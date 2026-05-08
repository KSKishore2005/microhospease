package com.cognizant.hospease.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequestDto {
    private String reportType;
    private Long generatedByStaffId;
    private String contentSummary;
}