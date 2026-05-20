package com.cognizant.hospease.controller;

import com.cognizant.hospease.common.exception.ResourceNotFoundException;
import com.cognizant.hospease.dto.AuditPackageRequestDto;
import com.cognizant.hospease.dto.AuditPackageResponseDto;
import com.cognizant.hospease.security.RoleRequired;
import com.cognizant.hospease.service.AuditPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/audit-packages")
@RequiredArgsConstructor
public class AuditPackageController {

    private final AuditPackageService auditPackageService;

    @Value("${report.storage.path}")
    private String reportPath;

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

    /**
     * Streams the generated audit-package PDF. Mirrors the reports download
     * endpoint so the frontend can fetch the PDF with the JWT attached.
     */
    @GetMapping("/{id}/download")
    @RoleRequired({"ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<Resource> downloadPackage(@PathVariable Long id) {
        AuditPackageResponseDto pkg = auditPackageService.getPackageById(id);

        // packageUri historically stored the absolute filesystem path. Resolve to
        // either that path or, as a fallback, look for any "*_ID_<id>.pdf" file
        // in the configured storage directory.
        File pdf = null;
        if (pkg.getPackageUri() != null && !pkg.getPackageUri().isBlank()
                && new File(pkg.getPackageUri()).isFile()) {
            pdf = new File(pkg.getPackageUri());
        } else {
            File dir = new File(reportPath);
            File[] matches = dir.listFiles((d, n) ->
                    n.startsWith("AUDIT_") && n.endsWith(".pdf") && n.contains("_" + id + "_"));
            if (matches != null && matches.length > 0) pdf = matches[0];
        }

        if (pdf == null || !pdf.isFile()) {
            log.warn("Audit package PDF not found for id={}", id);
            throw new ResourceNotFoundException("Audit package PDF", "id", id);
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + pdf.getName() + "\"")
                .body(new FileSystemResource(pdf));
    }
}