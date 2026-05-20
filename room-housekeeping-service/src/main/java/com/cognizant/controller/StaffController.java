package com.cognizant.controller;

import com.cognizant.dto.StaffRequestDto;
import com.cognizant.dto.StaffResponseDto;
import com.cognizant.entity.Staff;
import com.cognizant.enums.StaffStatus;
import com.cognizant.enums.UserRole;
import com.cognizant.security.RoleRequired;
import com.cognizant.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    // ------------------------------------------------------------------ //
    //  Mapping helpers                                                     //
    // ------------------------------------------------------------------ //

    private StaffResponseDto toDto(Staff s) {
        return StaffResponseDto.builder()
                .id(s.getStaffId())                          // entity.staffId → dto.id
                .userId(s.getUserId())
                .name(s.getName())
                .role(s.getRole() != null ? s.getRole().name() : null)
                .department(s.getDepartment())
                .phone(s.getPhone())
                .email(s.getEmail())
                .hireDate(s.getHireDate())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .build();
    }

    private Staff toEntity(StaffRequestDto dto) {
        Staff s = new Staff();
        s.setName(dto.getName());
        s.setDepartment(dto.getDepartment());
        s.setPhone(dto.getPhone());
        s.setEmail(dto.getEmail());
        s.setHireDate(dto.getHireDate());

        // Parse role string → enum. Reject unknown values with a clear 400 instead
        // of silently coercing to STAFF, which previously hid typo bugs in callers.
        if (dto.getRole() != null && !dto.getRole().isBlank()) {
            try {
                s.setRole(UserRole.valueOf(dto.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new com.cognizant.exception.BadRequestException(
                        "Invalid role '" + dto.getRole() + "'. Allowed: "
                                + java.util.Arrays.toString(UserRole.values()));
            }
        }

        // Parse status string → enum. Same explicit-rejection treatment.
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            try {
                s.setStatus(StaffStatus.valueOf(dto.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new com.cognizant.exception.BadRequestException(
                        "Invalid status '" + dto.getStatus() + "'. Allowed: "
                                + java.util.Arrays.toString(StaffStatus.values()));
            }
        } else {
            s.setStatus(StaffStatus.ACTIVE);
        }

        return s;
    }

    // ------------------------------------------------------------------ //
    //  Endpoints                                                           //
    // ------------------------------------------------------------------ //

    @GetMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<StaffResponseDto>> getAllStaff() {
        List<StaffResponseDto> result = staffService.getAllStaff()
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<StaffResponseDto> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(toDto(staffService.getStaffById(id)));
    }

    @GetMapping("/department/{department}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<StaffResponseDto>> getStaffByDepartment(@PathVariable String department) {
        List<StaffResponseDto> result = staffService.getStaffByDepartment(department)
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<StaffResponseDto> createStaff(
            @RequestBody StaffRequestDto dto,
            @RequestParam(required = false) Long userId) {
        Staff entity = toEntity(dto);
        Staff saved = staffService.createStaff(entity, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @PutMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<StaffResponseDto> updateStaff(
            @PathVariable Long id,
            @RequestBody StaffRequestDto dto) {
        Staff entity = toEntity(dto);
        Staff updated = staffService.updateStaff(id, entity);
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }
}
