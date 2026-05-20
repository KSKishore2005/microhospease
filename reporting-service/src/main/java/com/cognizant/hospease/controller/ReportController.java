package com.cognizant.hospease.controller;

import com.cognizant.hospease.common.exception.ResourceNotFoundException;
import com.cognizant.hospease.dto.ReportRequestDto;
import com.cognizant.hospease.dto.ReportResponseDto;
import com.cognizant.hospease.enums.ReportScope;
import com.cognizant.hospease.security.RoleRequired;
import com.cognizant.hospease.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @Value("${report.storage.path}")
    private String reportPath;

    @GetMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<ReportResponseDto>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<ReportResponseDto> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @GetMapping("/scope/{scope}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<ReportResponseDto>> getReportsByScope(@PathVariable ReportScope scope) {
        return ResponseEntity.ok(reportService.getReportsByScope(scope));
    }

    @GetMapping("/staff/{staffId}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<ReportResponseDto>> getReportsByStaff(@PathVariable Long staffId) {
        return ResponseEntity.ok(reportService.getReportsByStaff(staffId));
    }

    @PostMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ReportResponseDto> createReport(@Valid @RequestBody ReportRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.createReport(dto));
    }

    @PutMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ReportResponseDto> updateReport(
            @PathVariable Long id, @Valid @RequestBody ReportRequestDto dto) {
        return ResponseEntity.ok(reportService.updateReport(id, dto));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Streams the generated PDF for a report. Goes through the API gateway so the
     * JWT auth flow protects the file (the static-resource fallback at /reports/**
     * doesn't traverse the gateway).
     */
    @GetMapping("/{id}/download")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<Resource> downloadReport(@PathVariable Long id) {
        ReportResponseDto report = reportService.getReportById(id);

        String fileName = report.getReportType().replaceAll("\\s+", "_")
                + "_ID_" + id + ".pdf";
        File pdf = new File(reportPath, fileName);
        if (!pdf.exists() || !pdf.isFile()) {
            log.warn("PDF file not found for report id={} at {}", id, pdf.getAbsolutePath());
            throw new ResourceNotFoundException("Report PDF", "id", id);
        }

        FileSystemResource resource = new FileSystemResource(pdf);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
