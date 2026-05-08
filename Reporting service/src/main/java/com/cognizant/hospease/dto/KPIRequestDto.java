package com.cognizant.hospease.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KPIRequestDto {

    @NotBlank(message = "KPI name is required")
    @Size(max = 255, message = "KPI name must be at most 255 characters")
    private String name;

    @NotBlank(message = "Definition is required")
    @Size(max = 1000, message = "Definition must be at most 1000 characters")
    private String definition;

    @NotNull(message = "Target value is required")
    private BigDecimal target;

    private BigDecimal currentValue;

    @NotBlank(message = "Reporting period is required")
    @Size(max = 50, message = "Reporting period must be at most 50 characters")
    private String reportingPeriod;
}