package com.cognizant.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auditId;

    // 🔹 Decoupled user reference (NO JPA relationship)
    @Column(nullable = false)
    private Long userId;

    @Column(length = 255)
    private String userName;

    // 🔹 Action performed (e.g., LOGIN, CREATE_DEAL)
    @Column(nullable = false)
    private String action;

    // 🔹 Resource type (USER, DEAL, INVOICE, etc.)
    @Column(nullable = false)
    private String resourceType;

    // 🔹 ID of the resource affected
    private Long resourceId;

    // 🔹 Additional details (stored as JSON string)
    @Column(columnDefinition = "TEXT")
    private String detailsJson;

    // 🔹 Timestamp
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}