package com.cognizant.hospease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KPIResponseDto {
    private Long kpiId;
    private String name;
    private String definition;
    private BigDecimal target;
    private BigDecimal currentValue;
    private String reportingPeriod;
}