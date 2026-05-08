package com.cognizant.hospease.dto;

import com.cognizant.hospease.entity.AuditPackage;
import com.cognizant.hospease.entity.KPI;
import com.cognizant.hospease.entity.Report;

import java.util.List;
import java.util.stream.Collectors;

public class DtoMapper {

    // AuditPackage Mappings
    public static AuditPackageResponseDto toAuditPackageResponseDto(AuditPackage auditPackage) {
        if (auditPackage == null) return null;
        return AuditPackageResponseDto.builder()
                .packageId(auditPackage.getPackageId())
                .periodStart(auditPackage.getPeriodStart())
                .periodEnd(auditPackage.getPeriodEnd())
                .contentsJson(auditPackage.getContentsJson())
                .generatedAt(auditPackage.getGeneratedAt())
                .packageUri(auditPackage.getPackageUri())
                .build();
    }

    public static AuditPackage toAuditPackage(AuditPackageRequestDto dto) {
        if (dto == null) return null;
        return AuditPackage.builder()
                .periodStart(dto.getPeriodStart())
                .periodEnd(dto.getPeriodEnd())
                .contentsJson(dto.getContentsJson())
                .packageUri(dto.getPackageUri())
                .build();
    }

    // Fixed Report Mappings to match your Entity fields
    public static ReportResponseDto toReportResponseDto(Report report) {
        if (report == null) return null;
        return ReportResponseDto.builder()
                .reportId(report.getReportId())
                .reportType(report.getReportType()) // Matches Entity field
                .generatedAt(report.getGeneratedAt())
                .generatedByStaffId(report.getGeneratedByStaffId()) // Matches Entity field
                .contentSummary(report.getContentSummary()) // Matches Entity field
                .build();
    }

    public static Report toReport(ReportRequestDto dto) {
        if (dto == null) return null;
        return Report.builder()
                .reportType(dto.getReportType()) // Matches DTO field
                .generatedByStaffId(dto.getGeneratedByStaffId()) // Matches DTO field
                .contentSummary(dto.getContentSummary()) // Matches DTO field
                .build();
    }

    // KPI Mappings
    public static KPIResponseDto toKPIResponseDto(KPI kpi) {
        if (kpi == null) return null;
        return KPIResponseDto.builder()
                .kpiId(kpi.getKpiId())
                .name(kpi.getName())
                .definition(kpi.getDefinition())
                .target(kpi.getTarget())
                .currentValue(kpi.getCurrentValue())
                .reportingPeriod(kpi.getReportingPeriod())
                .build();
    }

    public static KPI toKPI(KPIRequestDto dto) {
        if (dto == null) return null;
        return KPI.builder()
                .name(dto.getName())
                .definition(dto.getDefinition())
                .target(dto.getTarget())
                .currentValue(dto.getCurrentValue())
                .reportingPeriod(dto.getReportingPeriod())
                .build();
    }

    // List Mappings
    public static List<AuditPackageResponseDto> toAuditPackageResponseDtoList(List<AuditPackage> auditPackages) {
        return auditPackages.stream().map(DtoMapper::toAuditPackageResponseDto).collect(Collectors.toList());
    }

    public static List<ReportResponseDto> toReportResponseDtoList(List<Report> reports) {
        return reports.stream().map(DtoMapper::toReportResponseDto).collect(Collectors.toList());
    }

    public static List<KPIResponseDto> toKPIResponseDtoList(List<KPI> kpis) {
        return kpis.stream().map(DtoMapper::toKPIResponseDto).collect(Collectors.toList());
    }
}