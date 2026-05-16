package com.cognizant.hospease.dto;

import com.cognizant.hospease.enums.ReportScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequestDto {

    @NotBlank(message = "reportType is required")
    @Size(max = 100, message = "reportType must be at most 100 characters")
    private String reportType;

    private ReportScope scope;

    @NotNull(message = "generatedByStaffId is required")
    @Positive(message = "generatedByStaffId must be positive")
    private Long generatedByStaffId;

    @Size(max = 5000, message = "contentSummary must be at most 5000 characters")
    private String contentSummary;
}
