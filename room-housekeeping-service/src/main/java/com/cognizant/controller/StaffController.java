package com.cognizant.controller;

import com.cognizant.entity.Staff;
import com.cognizant.security.RoleRequired;
import com.cognizant.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @GetMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<Staff>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }

    @GetMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<Staff> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaffById(id));
    }

    @GetMapping("/department/{department}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<Staff>> getStaffByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(staffService.getStaffByDepartment(department));
    }

    @PostMapping
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<Staff> createStaff(
            @RequestBody Staff staff,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffService.createStaff(staff, userId));
    }

    @PutMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<Staff> updateStaff(@PathVariable Long id, @RequestBody Staff staff) {
        return ResponseEntity.ok(staffService.updateStaff(id, staff));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }
}