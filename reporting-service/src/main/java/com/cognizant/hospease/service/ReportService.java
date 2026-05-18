package com.cognizant.hospease.service;

import com.cognizant.hospease.client.UserServiceClient;
import com.cognizant.hospease.client.dto.UserDto;
import com.cognizant.hospease.common.exception.BadRequestException;
import com.cognizant.hospease.common.exception.ResourceNotFoundException;
import com.cognizant.hospease.dto.DtoMapper;
import com.cognizant.hospease.dto.ReportRequestDto;
import com.cognizant.hospease.dto.ReportResponseDto;
import com.cognizant.hospease.entity.Report;
import com.cognizant.hospease.enums.ReportScope;
import com.cognizant.hospease.repository.ReportRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserServiceClient userServiceClient;
    private final PdfGeneratorService pdfGeneratorService;
    private final ReportContentGeneratorService contentGeneratorService;

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getAllReports() {
        return reportRepository.findAll().stream()
                .map(this::enrich)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReportResponseDto getReportById(Long id) {
        return enrich(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getReportsByScope(ReportScope scope) {
        return reportRepository.findByScope(scope).stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getReportsByStaff(Long staffId) {
        return reportRepository.findByGeneratedByStaffId(staffId).stream()
                .map(this::enrich).toList();
    }

    public ReportResponseDto createReport(ReportRequestDto dto) {
        log.info("Creating report '{}' by staffId={}", dto.getReportType(), dto.getGeneratedByStaffId());

        // Validate staff exists via user-service
        UserDto staff = fetchStaffOrThrow(dto.getGeneratedByStaffId());
        if (staff.getStatus() != null && !"ACTIVE".equalsIgnoreCase(staff.getStatus())) {
            throw new BadRequestException(
                    "Cannot create report: staff id=" + staff.getUserId()
                            + " has status '" + staff.getStatus() + "'");
        }

        // Auto-generate contentSummary if not provided
        if (dto.getContentSummary() == null || dto.getContentSummary().isBlank()) {
            log.info("contentSummary not provided — auto-generating for scope={}", dto.getScope());
            dto.setContentSummary(contentGeneratorService.generate(dto.getScope()));
        }

        Report report = DtoMapper.toReport(dto);
        Report saved = reportRepository.save(report);

        // Generate PDF
        String pdfPath = generatePdf(saved, staff);
        if (pdfPath != null) {
            saved.setReportUri(pdfPath);
            saved = reportRepository.save(saved);
        }

        log.info("Report created id={}", saved.getReportId());
        return DtoMapper.toReportResponseDto(saved, staff);
    }

    public ReportResponseDto updateReport(Long id, ReportRequestDto dto) {
        Report existing = findEntityById(id);

        UserDto staff = fetchStaffOrThrow(dto.getGeneratedByStaffId());
        if (staff.getStatus() != null && !"ACTIVE".equalsIgnoreCase(staff.getStatus())) {
            throw new BadRequestException(
                    "Cannot update report: staff id=" + staff.getUserId()
                            + " has status '" + staff.getStatus() + "'");
        }

        // Auto-generate contentSummary if not provided
        if (dto.getContentSummary() == null || dto.getContentSummary().isBlank()) {
            log.info("contentSummary not provided on update — auto-generating for scope={}", dto.getScope());
            dto.setContentSummary(contentGeneratorService.generate(dto.getScope()));
        }

        existing.setReportType(dto.getReportType());
        existing.setScope(dto.getScope());
        existing.setGeneratedByStaffId(dto.getGeneratedByStaffId());
        existing.setContentSummary(dto.getContentSummary());
        Report saved = reportRepository.save(existing);

        // Regenerate PDF with updated content
        String pdfPath = generatePdf(saved, staff);
        if (pdfPath != null) {
            saved.setReportUri(pdfPath);
            saved = reportRepository.save(saved);
        }

        log.info("Report updated id={}", saved.getReportId());
        return DtoMapper.toReportResponseDto(saved, staff);
    }

    public void deleteReport(Long id) {
        Report report = findEntityById(id);
        reportRepository.delete(report);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private Report findEntityById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", id));
    }

    private UserDto fetchStaffOrThrow(Long staffId) {
        try {
            UserDto u = userServiceClient.getUserById(staffId);
            if (u == null) throw new ResourceNotFoundException("Staff", "id", staffId);
            return u;
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Staff", "id", staffId);
        }
    }

    private String generatePdf(Report report, UserDto staff) {
        try {
            String fileName = report.getReportType().replaceAll("\\s+", "_")
                    + "_ID_" + report.getReportId() + ".pdf";
            String staffLabel = staff != null && staff.getName() != null
                    ? staff.getName() + " (id=" + staff.getUserId() + ")"
                    : "Staff ID: " + report.getGeneratedByStaffId();
            String scope = report.getScope() != null ? report.getScope().name() : "GENERAL";
            return pdfGeneratorService.generateReportPdf(
                    fileName, report.getReportType(), scope, staffLabel, report.getContentSummary());
        } catch (Exception e) {
            log.error("PDF generation failed for reportId={}: {}",
                    report.getReportId(), e.getMessage());
            return null;
        }
    }

    /** Enriches with staff data; tolerates upstream failures. */
    ReportResponseDto enrich(Report report) {
        UserDto staff = null;
        try {
            staff = userServiceClient.getUserById(report.getGeneratedByStaffId());
        } catch (Exception e) {
            log.warn("Failed to enrich staff id={}: {}",
                    report.getGeneratedByStaffId(), e.getMessage());
        }
        return DtoMapper.toReportResponseDto(report, staff);
    }
}
