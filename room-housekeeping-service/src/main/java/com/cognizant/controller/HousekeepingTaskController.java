package com.cognizant.controller;

import com.cognizant.dto.DtoMapper;
import com.cognizant.dto.HousekeepingTaskRequestDto;
import com.cognizant.dto.HousekeepingTaskResponseDto;
import com.cognizant.enums.HousekeepingStatus;
import com.cognizant.security.RoleRequired;
import com.cognizant.service.HousekeepingTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/housekeeping-tasks")
@RequiredArgsConstructor
public class HousekeepingTaskController {

    private final HousekeepingTaskService housekeepingTaskService;

    @GetMapping
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<HousekeepingTaskResponseDto>> getAllTasks() {
        return ResponseEntity.ok(housekeepingTaskService.getAllTasks());
    }

    @GetMapping("/{id}")
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<HousekeepingTaskResponseDto> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(housekeepingTaskService.getTaskById(id));
    }

    @GetMapping("/room/{roomId}")
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<HousekeepingTaskResponseDto>> getTasksByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(housekeepingTaskService.getTasksByRoom(roomId));
    }

    @GetMapping("/assignee/{userId}")
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<HousekeepingTaskResponseDto>> getTasksByAssignee(@PathVariable Long userId) {
        return ResponseEntity.ok(housekeepingTaskService.getTasksByAssignee(userId));
    }

    @GetMapping("/status/{status}")
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<HousekeepingTaskResponseDto>> getTasksByStatus(@PathVariable HousekeepingStatus status) {
        return ResponseEntity.ok(housekeepingTaskService.getTasksByStatus(status));
    }

    @PostMapping
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<HousekeepingTaskResponseDto> createTask(@Valid @RequestBody HousekeepingTaskRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(housekeepingTaskService.createTask(
                        DtoMapper.toHousekeepingTask(requestDto),
                        requestDto.getRoomId(),
                        requestDto.getAssignedToUserId()));
    }

    @PutMapping("/{id}")
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<HousekeepingTaskResponseDto> updateTask(
            @PathVariable Long id, @Valid @RequestBody HousekeepingTaskRequestDto requestDto) {
        return ResponseEntity.ok(housekeepingTaskService.updateTask(id, DtoMapper.toHousekeepingTask(requestDto)));
    }

    @PatchMapping("/{id}/status")
    @RoleRequired({"HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<HousekeepingTaskResponseDto> updateTaskStatus(
            @PathVariable Long id, @RequestParam HousekeepingStatus status) {
        return ResponseEntity.ok(housekeepingTaskService.updateTaskStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        housekeepingTaskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}