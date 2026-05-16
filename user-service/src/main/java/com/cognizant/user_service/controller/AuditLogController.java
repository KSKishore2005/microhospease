package com.cognizant.user_service.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cognizant.user_service.dto.AuditLogRequestDTO;
import com.cognizant.user_service.dto.AuditLogResponseDTO;
import com.cognizant.user_service.entity.AuditLog;
import com.cognizant.user_service.service.AuditLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR','AUDITOR')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @PostMapping
    @PreAuthorize("permitAll()") // allow other services
    public ResponseEntity<AuditLogResponseDTO> createAuditLog(
            @RequestBody AuditLogRequestDTO dto) {

        AuditLog auditLog = mapToEntity(dto);
        AuditLog saved = auditLogService.createAuditLog(auditLog);

        return new ResponseEntity<>(mapToResponseDTO(saved), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogResponseDTO> getAuditLogById(@PathVariable Long id) {
        return ResponseEntity.ok(
                mapToResponseDTO(auditLogService.getAuditLogById(id))
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLogResponseDTO>> getAuditLogsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(
                auditLogService.getAuditLogsByUserId(userId)
                        .stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList())
        );
    }

    @GetMapping("/resource/{resourceType}/{resourceId}")
    public ResponseEntity<List<AuditLogResponseDTO>> getAuditLogsByResource(
            @PathVariable String resourceType,
            @PathVariable Long resourceId) {

        return ResponseEntity.ok(
                auditLogService.getAuditLogsByResource(resourceType, resourceId)
                        .stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList())
        );
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponseDTO>> getAllAuditLogs() {
        return ResponseEntity.ok(
                auditLogService.getAllAuditLogs()
                        .stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList())
        );
    }

    // ✅ FIXED (NO USER LOOKUP)
    private AuditLog mapToEntity(AuditLogRequestDTO dto) {
        AuditLog auditLog = new AuditLog();

        auditLog.setUserId(dto.getUserId());
        auditLog.setAction(dto.getAction());
        auditLog.setResourceType(dto.getResourceType());
        auditLog.setResourceId(dto.getResourceId());
        auditLog.setDetailsJson(dto.getDetailsJson());

        return auditLog;
    }

    // ✅ FIXED RESPONSE
    private AuditLogResponseDTO mapToResponseDTO(AuditLog auditLog) {
        AuditLogResponseDTO dto = new AuditLogResponseDTO();

        dto.setAuditId(auditLog.getAuditId());
        dto.setUserId(auditLog.getUserId());
        dto.setUserName(auditLog.getUserName());
        dto.setAction(auditLog.getAction());
        dto.setResourceType(auditLog.getResourceType());
        dto.setResourceId(auditLog.getResourceId());
        dto.setDetailsJson(auditLog.getDetailsJson());
        dto.setTimestamp(auditLog.getTimestamp());

        return dto;
    }
}