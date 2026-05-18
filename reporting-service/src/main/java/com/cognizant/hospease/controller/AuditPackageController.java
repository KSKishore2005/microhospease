package com.cognizant.hospease.controller;

import com.cognizant.hospease.dto.AuditPackageRequestDto;
import com.cognizant.hospease.dto.AuditPackageResponseDto;
import com.cognizant.hospease.security.RoleRequired;
import com.cognizant.hospease.service.AuditPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/audit-packages")
@RequiredArgsConstructor
public class AuditPackageController {

    private final AuditPackageService auditPackageService;

    @GetMapping
    @RoleRequired({"ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<AuditPackageResponseDto>> getAllPackages() {
        return ResponseEntity.ok(auditPackageService.getAllPackages());
    }

    @GetMapping("/range")
    @RoleRequired({"ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<AuditPackageResponseDto>> getPackagesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(auditPackageService.getPackagesByDateRange(from, to));
    }

    @GetMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<AuditPackageResponseDto> getPackageById(@PathVariable Long id) {
        return ResponseEntity.ok(auditPackageService.getPackageById(id));
    }

    @PostMapping
    @RoleRequired({"ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<AuditPackageResponseDto> createPackage(
            @Valid @RequestBody AuditPackageRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(auditPackageService.createPackage(dto));
    }

    @PutMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<AuditPackageResponseDto> updatePackage(
            @PathVariable Long id, @Valid @RequestBody AuditPackageRequestDto dto) {
        return ResponseEntity.ok(auditPackageService.updatePackage(id, dto));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deletePackage(@PathVariable Long id) {
        auditPackageService.deletePackage(id);
        return ResponseEntity.noContent().build();
    }
}