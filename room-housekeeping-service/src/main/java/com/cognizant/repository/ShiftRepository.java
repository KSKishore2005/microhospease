package com.cognizant.repository;

import com.cognizant.entity.Shift;
import com.cognizant.enums.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    List<Shift> findByStaff_StaffId(Long staffId);
    List<Shift> findByStatus(ShiftStatus status);
}
