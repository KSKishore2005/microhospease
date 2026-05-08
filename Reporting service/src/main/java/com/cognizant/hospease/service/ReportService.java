package com.cognizant.hospease.service;

import com.cognizant.hospease.client.StaffClient;
import com.cognizant.hospease.dto.ReportRequestDto;
import com.cognizant.hospease.dto.ReportResponseDto;
import com.cognizant.hospease.entity.Report;
import com.cognizant.hospease.exception.ResourceNotFoundException;
import com.cognizant.hospease.repository.ReportRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final StaffClient staffClient;
    private final PdfGeneratorService pdfGeneratorService; // New Injection

    public List<ReportResponseDto> getAllReports() {
        return reportRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @CircuitBreaker(name = "staffService", fallbackMethod = "fallbackCreateReport")
    public ReportResponseDto createReport(ReportRequestDto dto) {
        staffClient.getStaffById(dto.getGeneratedByStaffId());

        Report report = Report.builder()
                .reportType(dto.getReportType())
                .generatedAt(LocalDateTime.now())
                .generatedByStaffId(dto.getGeneratedByStaffId())
                .contentSummary(dto.getContentSummary())
                .build();

        Report savedReport = reportRepository.save(report);

        // Explicitly trigger PDF generation
        generatePhysicalFile(savedReport);

        return mapToResponseDTO(savedReport);
    }

    public ReportResponseDto fallbackCreateReport(ReportRequestDto dto, Throwable t) {
        log.error("Identity Service unavailable. Creating report with fallback logic. Error: {}", t.getMessage());

        Report report = Report.builder()
                .reportType(dto.getReportType())
                .generatedAt(LocalDateTime.now())
                .generatedByStaffId(dto.getGeneratedByStaffId())
                .contentSummary(dto.getContentSummary() + " [SYSTEM NOTE: Staff identity unverified]")
                .build();

        Report savedReport = reportRepository.save(report);

        // Still generate the PDF even if the identity service is down
        generatePhysicalFile(savedReport);

        return mapToResponseDTO(savedReport);
    }

    // Helper method to keep the main logic clean
    private void generatePhysicalFile(Report report) {
        try {
            // Change this line in generatePhysicalFile helper
            String fileName = report.getReportType().replace(" ", "_") + "_ID_" + report.getReportId() + ".pdf";
            pdfGeneratorService.generateOccupancyReport(
                    fileName,
                    report.getReportType(),
                    "Staff ID: " + report.getGeneratedByStaffId(),
                    report.getContentSummary()
            );
            log.info("Physical PDF file generated successfully: {}", fileName);
        } catch (Exception e) {
            log.error("Database record saved, but PDF generation failed: {}", e.getMessage());
        }
    }

    public ReportResponseDto getReportById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", id));
        return mapToResponseDTO(report);
    }

    public void deleteReport(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", id));
        reportRepository.delete(report);
    }

    private ReportResponseDto mapToResponseDTO(Report report) {
        return ReportResponseDto.builder()
                .reportId(report.getReportId())
                .reportType(report.getReportType())
                .generatedAt(report.getGeneratedAt())
                .generatedByStaffId(report.getGeneratedByStaffId())
                .contentSummary(report.getContentSummary())
                .build();
    }
}