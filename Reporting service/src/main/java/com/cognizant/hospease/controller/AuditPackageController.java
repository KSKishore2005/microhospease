package com.cognizant.hospease.controller;

import com.cognizant.hospease.dto.AuditPackageRequestDto;
import com.cognizant.hospease.dto.AuditPackageResponseDto;
import com.cognizant.hospease.service.AuditPackageService;
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
    public ResponseEntity<List<AuditPackageResponseDto>> getAllPackages() {
        return ResponseEntity.ok(auditPackageService.getAllPackages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditPackageResponseDto> getPackageById(@PathVariable Long id) {
        return ResponseEntity.ok(auditPackageService.getPackageById(id));
    }

    @PostMapping
    public ResponseEntity<AuditPackageResponseDto> createPackage(@RequestBody AuditPackageRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(auditPackageService.createPackage(requestDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuditPackageResponseDto> updatePackage(
            @PathVariable Long id, @RequestBody AuditPackageRequestDto requestDto) {
        return ResponseEntity.ok(auditPackageService.updatePackage(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePackage(@PathVariable Long id) {
        auditPackageService.deletePackage(id);
        return ResponseEntity.noContent().build();
    }

//    @PostMapping("/monthly")
//    public ResponseEntity<AuditPackageResponseDto> createMonthlyAudit(
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
//
//        return new ResponseEntity<>(auditPackageService.createMonthlyAudit(start, end), HttpStatus.CREATED);
//    }
}