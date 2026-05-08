package com.cognizant.hospease.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_packages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long packageId;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    @Column(columnDefinition = "TEXT")
    private String contentsJson;

    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();

    private String packageUri;
}
