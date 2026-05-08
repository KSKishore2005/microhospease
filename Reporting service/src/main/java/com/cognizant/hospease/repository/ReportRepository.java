package com.cognizant.hospease.repository;

import com.cognizant.hospease.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    // Corrected to match the 'reportType' field in your Report entity
    List<Report> findByReportType(String reportType);
}