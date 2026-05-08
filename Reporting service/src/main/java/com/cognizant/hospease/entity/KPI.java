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

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String definition;

    private BigDecimal target;

    private BigDecimal currentValue;

    private String reportingPeriod;
}
