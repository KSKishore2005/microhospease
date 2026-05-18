package com.cognizant.hospease.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime generatedAt;

    private String packageUri;
}
