package com.cognizant.hospease.entity;

import com.cognizant.hospease.enums.ReportScope;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    private String reportType;
    private LocalDateTime generatedAt;

    // No @ManyToOne here! Just the ID.
    private Long generatedByStaffId;

    @Column(columnDefinition = "TEXT")
    private String contentSummary;
}