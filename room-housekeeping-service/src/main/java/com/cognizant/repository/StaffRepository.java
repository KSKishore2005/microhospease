package com.cognizant.repository;

import com.cognizant.entity.Staff;
import com.cognizant.enums.StaffStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUserId(Long userId);
    List<Staff> findByDepartment(String department);
    List<Staff> findByStatus(StaffStatus status);
}
