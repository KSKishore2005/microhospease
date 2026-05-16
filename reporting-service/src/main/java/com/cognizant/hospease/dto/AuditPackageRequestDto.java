package com.cognizant.hospease.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditPackageRequestDto {

    @NotNull(message = "periodStart is required")
    @JsonProperty("startDate")
    private LocalDate periodStart;

    @NotNull(message = "periodEnd is required")
    @JsonProperty("endDate")
    private LocalDate periodEnd;

    private String contentsJson;
}
