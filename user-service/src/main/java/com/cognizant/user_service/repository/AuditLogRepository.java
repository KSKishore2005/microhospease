package com.cognizant.user_service.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cognizant.user_service.entity.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByResourceTypeAndResourceId(String resourceType, Long resourceId);

    List<AuditLog> findByResourceTypeAndTimestampBetween(String resourceType, LocalDateTime start, LocalDateTime end);

    List<AuditLog> findByActionAndTimestampBetween(String action, LocalDateTime start, LocalDateTime end);

    List<AuditLog> findByUserId(Long userId);

    List<AuditLog> findByUserIdAndTimestampBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
}
