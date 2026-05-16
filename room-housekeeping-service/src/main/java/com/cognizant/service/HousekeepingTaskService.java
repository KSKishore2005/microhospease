package com.cognizant.service;

import com.cognizant.dto.DtoMapper;
import com.cognizant.dto.HousekeepingTaskResponseDto;
import com.cognizant.entity.HousekeepingTask;
import com.cognizant.entity.Room;
import com.cognizant.enums.HousekeepingStatus;
import com.cognizant.exception.ResourceNotFoundException;
import com.cognizant.repository.HousekeepingTaskRepository;
import com.cognizant.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
        task.setRoom(room);
        if (assignedToUserId != null) {
            task.setAssignedToUserId(assignedToUserId);
        }
        return DtoMapper.toHousekeepingTaskResponseDto(housekeepingTaskRepository.save(task));
    }

    public HousekeepingTaskResponseDto updateTaskStatus(Long id, HousekeepingStatus status) {
        HousekeepingTask task = getTaskEntityById(id);
        task.setStatus(status);
        if (status == HousekeepingStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
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
