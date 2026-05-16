package com.cognizant.hospease.controller;

import com.cognizant.hospease.dto.ReportRequestDto;
import com.cognizant.hospease.dto.ReportResponseDto;
import com.cognizant.hospease.enums.ReportScope;
import com.cognizant.hospease.security.RoleRequired;
import com.cognizant.hospease.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

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

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}