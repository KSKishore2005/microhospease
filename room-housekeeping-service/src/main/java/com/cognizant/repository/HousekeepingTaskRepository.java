package com.cognizant.repository;

import com.cognizant.entity.HousekeepingTask;
import com.cognizant.enums.HousekeepingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HousekeepingTaskRepository extends JpaRepository<HousekeepingTask, Long> {
    List<HousekeepingTask> findByRoom_RoomId(Long roomId);
    List<HousekeepingTask> findByAssignedToUserId(Long assignedToUserId);
    List<HousekeepingTask> findByStatus(HousekeepingStatus status);
}
