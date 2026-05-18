package com.cognizant.hospease.repository;

import com.cognizant.hospease.entity.Report;
import com.cognizant.hospease.enums.ReportScope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReportType(String reportType);
    List<Report> findByScope(ReportScope scope);
    List<Report> findByGeneratedByStaffId(Long staffId);
}
