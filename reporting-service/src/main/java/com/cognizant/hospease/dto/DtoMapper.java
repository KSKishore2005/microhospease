package com.cognizant.hospease.dto;

import com.cognizant.hospease.client.dto.UserDto;
import com.cognizant.hospease.entity.AuditPackage;
import com.cognizant.hospease.entity.KPI;
import com.cognizant.hospease.entity.Report;

import java.util.List;

public final class DtoMapper {

    private DtoMapper() {}

    // ─── Report ──────────────────────────────────────────────────────────────────

    public static ReportResponseDto toReportResponseDto(Report report) {
        return toReportResponseDto(report, null);
    }

    public static ReportResponseDto toReportResponseDto(Report report, UserDto staff) {
        if (report == null) return null;
        return ReportResponseDto.builder()
                .reportId(report.getReportId())
                .reportType(report.getReportType())
                .scope(report.getScope())
                .generatedAt(report.getGeneratedAt())
                .generatedByStaffId(report.getGeneratedByStaffId())
                .contentSummary(report.getContentSummary())
                .reportUri(report.getReportUri())
                .staff(staff)
                .build();
    }

    public static Report toReport(ReportRequestDto dto) {
        if (dto == null) return null;
        return Report.builder()
                .reportType(dto.getReportType())
                .scope(dto.getScope())
                .generatedByStaffId(dto.getGeneratedByStaffId())
                .contentSummary(dto.getContentSummary())
                .build();
    }

    // ─── KPI ─────────────────────────────────────────────────────────────────────

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

    public static List<KPIResponseDto> toKPIResponseDtoList(List<KPI> kpis) {
        return kpis.stream().map(DtoMapper::toKPIResponseDto).toList();
    }

    // ─── Audit Package ───────────────────────────────────────────────────────────

    public static AuditPackageResponseDto toAuditPackageResponseDto(AuditPackage pkg) {
        if (pkg == null) return null;
        return AuditPackageResponseDto.builder()
                .packageId(pkg.getPackageId())
                .periodStart(pkg.getPeriodStart())
                .periodEnd(pkg.getPeriodEnd())
                .contentsJson(pkg.getContentsJson())
                .packageUri(pkg.getPackageUri())
                .generatedAt(pkg.getGeneratedAt())
                .build();
    }

    public static AuditPackage toAuditPackage(AuditPackageRequestDto dto) {
        if (dto == null) return null;
        return AuditPackage.builder()
                .periodStart(dto.getPeriodStart())
                .periodEnd(dto.getPeriodEnd())
                .contentsJson(dto.getContentsJson())
                .build();
    }

    public static List<AuditPackageResponseDto> toAuditPackageResponseDtoList(List<AuditPackage> list) {
        return list.stream().map(DtoMapper::toAuditPackageResponseDto).toList();
    }
}
