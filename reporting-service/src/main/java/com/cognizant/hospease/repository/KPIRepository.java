package com.cognizant.hospease.repository;

import com.cognizant.hospease.entity.KPI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KPIRepository extends JpaRepository<KPI, Long> {
    List<KPI> findByReportingPeriod(String reportingPeriod);
    List<KPI> findByName(String name);
}
