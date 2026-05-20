package com.cognizant.service;

import com.cognizant.dto.DtoMapper;
import com.cognizant.dto.HousekeepingTaskResponseDto;
import com.cognizant.entity.HousekeepingTask;
import com.cognizant.entity.Room;
import com.cognizant.enums.HousekeepingStatus;
import com.cognizant.enums.RoomStatus;
import com.cognizant.exception.BadRequestException;
import com.cognizant.exception.ResourceNotFoundException;
import com.cognizant.repository.HousekeepingTaskRepository;
import com.cognizant.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HousekeepingTaskService {

    private final HousekeepingTaskRepository housekeepingTaskRepository;
    private final RoomRepository roomRepository;

    private HousekeepingTask getTaskEntityById(Long id) {
        return housekeepingTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HousekeepingTask", "id", id));
    }

    public List<HousekeepingTaskResponseDto> getAllTasks() {
        return housekeepingTaskRepository.findAll().stream()
                .map(DtoMapper::toHousekeepingTaskResponseDto)
                .toList();
    }

    public HousekeepingTaskResponseDto getTaskById(Long id) {
        return housekeepingTaskRepository.findById(id)
                .map(DtoMapper::toHousekeepingTaskResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("HousekeepingTask", "id", id));
    }

    public List<HousekeepingTaskResponseDto> getTasksByRoom(Long roomId) {
        return housekeepingTaskRepository.findByRoom_RoomId(roomId).stream()
                .map(DtoMapper::toHousekeepingTaskResponseDto)
                .toList();
    }

    public List<HousekeepingTaskResponseDto> getTasksByAssignee(Long userId) {
        return housekeepingTaskRepository.findByAssignedToUserId(userId).stream()
                .map(DtoMapper::toHousekeepingTaskResponseDto)
                .toList();
    }

    public List<HousekeepingTaskResponseDto> getTasksByStatus(HousekeepingStatus status) {
        return housekeepingTaskRepository.findByStatus(status).stream()
                .map(DtoMapper::toHousekeepingTaskResponseDto)
                .toList();
    }

    public HousekeepingTaskResponseDto createTask(HousekeepingTask task, Long roomId, Long assignedToUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));

        // A guest is physically in an OCCUPIED room; opening a cleaning task on it
        // (which would auto-flip status to CLEANING) makes the room look unbookable
        // while a paying guest is in it. Cleaning happens AFTER checkout.
        if (room.getStatus() == RoomStatus.OCCUPIED) {
            throw new BadRequestException(
                    "Cannot create a housekeeping task for room " + room.getNumber()
                            + " — it is currently OCCUPIED. Wait until check-out.");
        }

        // Reject obviously-broken scheduling input.
        if (task.getScheduledAt() != null && task.getScheduledAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new BadRequestException("scheduledAt cannot be in the past.");
        }

        task.setRoom(room);
        if (assignedToUserId != null) {
            task.setAssignedToUserId(assignedToUserId);
        }
        HousekeepingTask saved = housekeepingTaskRepository.save(task);

        // When a cleaning task is opened on an AVAILABLE room, transition it to
        // CLEANING so it can't be re-booked while housekeeping is in progress.
        if (room.getStatus() == RoomStatus.AVAILABLE
                && (saved.getStatus() == null
                    || saved.getStatus() == HousekeepingStatus.PENDING
                    || saved.getStatus() == HousekeepingStatus.IN_PROGRESS)) {
            room.setStatus(RoomStatus.CLEANING);
            roomRepository.save(room);
        }

        return DtoMapper.toHousekeepingTaskResponseDto(saved);
    }

    public HousekeepingTaskResponseDto updateTaskStatus(Long id, HousekeepingStatus status) {
        HousekeepingTask task = getTaskEntityById(id);
        HousekeepingStatus previous = task.getStatus();
        task.setStatus(status);
        if (status == HousekeepingStatus.COMPLETED) {
            // Idempotent — only stamp completedAt the FIRST time the task becomes
            // COMPLETED. Network retries that re-send the same PATCH must not
            // overwrite the original completion timestamp and corrupt the audit trail.
            if (task.getCompletedAt() == null) {
                task.setCompletedAt(LocalDateTime.now());
            }

            // Cleaning is done → room is bookable again, but only flip if we
            // actually transitioned INTO COMPLETED on this call (avoid extra
            // saves on retries) and only if the room is currently CLEANING
            // (don't trample MAINTENANCE or OCCUPIED).
            if (previous != HousekeepingStatus.COMPLETED) {
                Room room = task.getRoom();
                if (room != null && room.getStatus() == RoomStatus.CLEANING) {
                    room.setStatus(RoomStatus.AVAILABLE);
                    roomRepository.save(room);
                    log.info("Room id={} released to AVAILABLE after task id={} completed",
                            room.getRoomId(), task.getTaskId());
                }
            }
        }
        return DtoMapper.toHousekeepingTaskResponseDto(housekeepingTaskRepository.save(task));
    }

    public HousekeepingTaskResponseDto updateTask(Long id, HousekeepingTask updated) {
        HousekeepingTask existing = getTaskEntityById(id);
        existing.setScheduledAt(updated.getScheduledAt());
        existing.setStatus(updated.getStatus());
        return DtoMapper.toHousekeepingTaskResponseDto(housekeepingTaskRepository.save(existing));
    }

    public void deleteTask(Long id) {
        HousekeepingTask task = getTaskEntityById(id);
        housekeepingTaskRepository.delete(task);
    }
}
