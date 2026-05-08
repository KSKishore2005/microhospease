package com.cognizant.hospease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditPackageResponseDto {

    private Long packageId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String contentsJson;
    private String packageUri;
    private LocalDateTime generatedAt;
}