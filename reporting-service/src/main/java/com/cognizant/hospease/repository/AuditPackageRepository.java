package com.cognizant.hospease.repository;

import com.cognizant.hospease.entity.AuditPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AuditPackageRepository extends JpaRepository<AuditPackage, Long> {

    /**
     * Returns audit packages whose period OVERLAPS the requested [from, to] window.
     * A package overlaps if its start is on or before `to` AND its end is on or after `from`.
     */
    @Query("SELECT a FROM AuditPackage a " +
           "WHERE a.periodStart <= :to AND a.periodEnd >= :from")
    List<AuditPackage> findOverlappingRange(@Param("from") LocalDate from,
                                            @Param("to") LocalDate to);

    /**
     * Legacy method retained for backward compatibility — finds packages whose entire
     * period is CONTAINED within [from, to]. Prefer {@link #findOverlappingRange} for
     * user-facing range queries.
     */
    List<AuditPackage> findByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqual(
            LocalDate from, LocalDate to);
}
