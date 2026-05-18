package com.cognizant.controller;

import com.cognizant.entity.Shift;
import com.cognizant.security.RoleRequired;
import com.cognizant.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    @GetMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR", "HOUSEKEEPING_STAFF", "FRONT_DESK_STAFF"})
    public ResponseEntity<List<Shift>> getAllShifts() {
        return ResponseEntity.ok(shiftService.getAllShifts());
    }

    @GetMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR", "HOUSEKEEPING_STAFF", "FRONT_DESK_STAFF"})
    public ResponseEntity<Shift> getShiftById(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getShiftById(id));
    }

    @GetMapping("/staff/{staffId}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR", "HOUSEKEEPING_STAFF", "FRONT_DESK_STAFF"})
    public ResponseEntity<List<Shift>> getShiftsByStaff(@PathVariable Long staffId) {
        return ResponseEntity.ok(shiftService.getShiftsByStaff(staffId));
    }

    @PostMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<Shift> createShift(
            @RequestBody Shift shift,
            @RequestParam Long staffId,
            @RequestParam(required = false) Long assignedById) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shiftService.createShift(shift, staffId, assignedById));
    }

    @PutMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<Shift> updateShift(@PathVariable Long id, @RequestBody Shift shift) {
        return ResponseEntity.ok(shiftService.updateShift(id, shift));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        shiftService.deleteShift(id);
        return ResponseEntity.noContent().build();
    }
}