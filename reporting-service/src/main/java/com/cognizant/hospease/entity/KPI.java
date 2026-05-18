package com.cognizant.hospease.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "kpis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KPI {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long kpiId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Column(precision = 12, scale = 2)
    private BigDecimal target;

    @Column(precision = 12, scale = 2)
    private BigDecimal currentValue;

    @Column(length = 50)
    private String reportingPeriod;
}
