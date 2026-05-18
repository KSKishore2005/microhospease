package com.cognizant.user_service.service;

import com.cognizant.user_service.entity.AuditLog;
import com.cognizant.user_service.exception.ResourceNotFoundException;
import com.cognizant.user_service.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Create audit log (main method)
     */
    public AuditLog createAuditLog(AuditLog auditLog) {

        if (auditLog.getUserId() == null) {
            throw new IllegalArgumentException("userId is required");
        }

        if (auditLog.getTimestamp() == null) {
            auditLog.setTimestamp(LocalDateTime.now());
        }

        return auditLogRepository.save(auditLog);
    }

    /**
     * Helper method (used inside IAM like AuthService)
     */
    public AuditLog createAuditLog(Long userId, String userName,
                                   String action, String resourceType,
                                   Long resourceId, String detailsJson) {

        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setUserName(userName);
        auditLog.setAction(action);
        auditLog.setResourceType(resourceType);
        auditLog.setResourceId(resourceId);
        auditLog.setDetailsJson(detailsJson);
        auditLog.setTimestamp(LocalDateTime.now());

        return auditLogRepository.save(auditLog);
    }

    /**
     * Get audit log by ID
     */
    @Transactional(readOnly = true)
    public AuditLog getAuditLogById(Long id) {
        return auditLogRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Audit log not found with id: " + id));
    }

    /**
     * Get logs by userId
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByUserId(Long userId) {
        return auditLogRepository.findByUserId(userId);
    }

    /**
     * Get logs by resource
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByResource(String resourceType, Long resourceId) {
        return auditLogRepository.findByResourceTypeAndResourceId(resourceType, resourceId);
    }

    /**
     * Get all logs
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }

    /**
     * Get logs by userId within date range
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByUserAndDateRange(Long userId,
                                                        LocalDateTime startDate,
                                                        LocalDateTime endDate) {
        return auditLogRepository.findByUserIdAndTimestampBetween(userId, startDate, endDate);
    }

    /**
     * Get logs by resource within date range
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByResourceAndDateRange(String resourceType,
                                                            LocalDateTime startDate,
                                                            LocalDateTime endDate) {
        return auditLogRepository.findByResourceTypeAndTimestampBetween(resourceType, startDate, endDate);
    }

    /**
     * Get logs by action within date range
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByActionAndDateRange(String action,
                                                          LocalDateTime startDate,
                                                          LocalDateTime endDate) {
        return auditLogRepository.findByActionAndTimestampBetween(action, startDate, endDate);
    }
}


