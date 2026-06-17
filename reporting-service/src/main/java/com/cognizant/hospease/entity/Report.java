package com.cognizant.hospease.entity;

import com.cognizant.hospease.enums.ReportScope;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports",
        indexes = {
                @Index(name = "idx_reportgs_staff", columnList = "generated_by_staff_id"),
                @Index(name = "idx_reports_scope", columnList = "scope")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @Column(nullable = false, length = 100)
    private String reportType;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private ReportScope scope;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @Column(name = "generated_by_staff_id", nullable = false)
    private Long generatedByStaffId;

    @Column(columnDefinition = "TEXT")
    private String contentSummary;

    /** Filepath of the generated PDF, if any. */
    private String reportUri;
}
