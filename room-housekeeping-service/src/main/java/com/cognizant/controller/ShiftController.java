package com.cognizant.controller;

import com.cognizant.dto.ShiftRequestDto;
import com.cognizant.dto.ShiftResponseDto;
import com.cognizant.entity.Shift;
import com.cognizant.enums.ShiftStatus;
import com.cognizant.security.RoleRequired;
import com.cognizant.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    // ------------------------------------------------------------------ //
    //  Mapping helpers                                                     //
    // ------------------------------------------------------------------ //

    /**
     * Entity → DTO.
     * Key field-name translations that the frontend depends on:
     *   entity.shiftId          → dto.id
     *   entity.staff.staffId    → dto.staffId
     *   entity.startAt (LDT)   → dto.startTime (ISO string)
     *   entity.endAt   (LDT)   → dto.endTime   (ISO string)
     *   entity.assignedByUserId → dto.assignedById
     */
    private ShiftResponseDto toDto(Shift s) {
        return ShiftResponseDto.builder()
                .id(s.getShiftId())
                .staffId(s.getStaff() != null ? s.getStaff().getStaffId() : null)
                .startTime(s.getStartAt() != null ? s.getStartAt().toString() : null)
                .endTime(s.getEndAt() != null ? s.getEndAt().toString() : null)
                .shiftType(s.getShiftType())
                .assignedById(s.getAssignedByUserId())
                .notes(s.getNotes())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .build();
    }

    /**
     * Parse an ISO datetime string that the frontend sends.
     * Handles both "2026-05-20T07:00:00" (with seconds) and
     * "2026-05-20T07:00" (browser datetime-local — no seconds).
     */
    private static final DateTimeFormatter LENIENT_DT = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd'T'HH:mm")
            .optionalStart().appendPattern(":ss").optionalEnd()
            .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
            .toFormatter();

    private LocalDateTime parseTime(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDateTime.parse(s, LENIENT_DT);
        } catch (Exception e) {
            // Previously this silently returned null on parse failure, which let
            // the controller create shifts with null times and pretend success.
            // Surfacing a 400 makes the failure obvious to the caller.
            throw new com.cognizant.exception.BadRequestException(
                    "Invalid datetime: '" + s + "'. Expected ISO-8601 like 2026-05-20T07:00:00");
        }
    }

    // ------------------------------------------------------------------ //
    //  Endpoints                                                           //
    // ------------------------------------------------------------------ //

    @GetMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR", "HOUSEKEEPING_STAFF", "FRONT_DESK_STAFF"})
    public ResponseEntity<List<ShiftResponseDto>> getAllShifts() {
        List<ShiftResponseDto> result = shiftService.getAllShifts()
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR", "HOUSEKEEPING_STAFF", "FRONT_DESK_STAFF"})
    public ResponseEntity<ShiftResponseDto> getShiftById(@PathVariable Long id) {
        return ResponseEntity.ok(toDto(shiftService.getShiftById(id)));
    }

    @GetMapping("/staff/{staffId}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR", "HOUSEKEEPING_STAFF", "FRONT_DESK_STAFF"})
    public ResponseEntity<List<ShiftResponseDto>> getShiftsByStaff(@PathVariable Long staffId) {
        List<ShiftResponseDto> result = shiftService.getShiftsByStaff(staffId)
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/shifts
     *
     * Accepts a JSON body (ShiftRequestDto) instead of the old raw Shift entity.
     * staffId is read from the body; assignedById comes from an optional query param.
     *
     * Body example:
     * {
     *   "staffId": 3,
     *   "startTime": "2026-05-20T07:00:00",
     *   "endTime":   "2026-05-20T15:00:00",
     *   "shiftType": "MORNING",
     *   "notes":     "Cover for sick leave"
     * }
     */
    @PostMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ShiftResponseDto> createShift(
            @RequestBody ShiftRequestDto dto,
            @RequestParam(required = false) Long assignedById) {

        Long staffId = dto.getStaffIdAsLong();
        LocalDateTime start = parseTime(dto.getStartTime());
        LocalDateTime end   = parseTime(dto.getEndTime());

        Shift saved = shiftService.createShiftFromDto(
                staffId, start, end,
                dto.getShiftType(), dto.getNotes(), assignedById);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    /**
     * PUT /api/shifts/{id}
     * Accepts ShiftRequestDto; partial updates (null fields are ignored in service).
     */
    @PutMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<ShiftResponseDto> updateShift(
            @PathVariable Long id,
            @RequestBody ShiftRequestDto dto) {

        Shift patch = new Shift();
        patch.setStartAt(parseTime(dto.getStartTime()));
        patch.setEndAt(parseTime(dto.getEndTime()));
        patch.setShiftType(dto.getShiftType());
        patch.setNotes(dto.getNotes());

        Shift updated = shiftService.updateShift(id, patch);
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        shiftService.deleteShift(id);
        return ResponseEntity.noContent().build();
    }
}
