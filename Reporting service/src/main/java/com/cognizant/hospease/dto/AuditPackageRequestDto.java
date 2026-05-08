package com.cognizant.hospease.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AuditPackageRequestDto {
    private String packageName;
    private String scope;

    @JsonProperty("startDate") // This maps the JSON "startDate"
    private LocalDate periodStart;

    @JsonProperty("endDate")   // This maps the JSON "endDate"
    private LocalDate periodEnd;

    private String contentsJson;
    private String packageUri;
    private String notes;
}