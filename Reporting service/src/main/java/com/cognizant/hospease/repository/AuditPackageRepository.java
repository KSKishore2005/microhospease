package com.cognizant.hospease.repository;

import com.cognizant.hospease.entity.AuditPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AuditPackageRepository extends JpaRepository<AuditPackage, Long> {
    List<AuditPackage> findByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqual(
            LocalDate from, LocalDate to);
}
