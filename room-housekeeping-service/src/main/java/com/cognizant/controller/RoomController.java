package com.cognizant.controller;

import com.cognizant.dto.DtoMapper;
import com.cognizant.dto.RoomRequestDto;
import com.cognizant.dto.RoomResponseDto;
import com.cognizant.entity.Room;
import com.cognizant.enums.RoomStatus;
import com.cognizant.enums.RoomType;
import com.cognizant.security.RoleRequired;
import com.cognizant.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<List<RoomResponseDto>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms().stream()
                .map(DtoMapper::toRoomResponseDto)
                .toList());
    }

    @GetMapping("/{id}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<RoomResponseDto> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toRoomResponseDto(roomService.getRoomById(id)));
    }

    @GetMapping("/available")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<List<RoomResponseDto>> getAvailableRooms() {
        return ResponseEntity.ok(roomService.getAvailableRooms().stream()
                .map(DtoMapper::toRoomResponseDto)
                .toList());
    }

    @GetMapping("/type/{type}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<List<RoomResponseDto>> getRoomsByType(@PathVariable RoomType type) {
        return ResponseEntity.ok(roomService.getRoomsByType(type).stream()
                .map(DtoMapper::toRoomResponseDto)
                .toList());
    }

    @GetMapping("/available/type/{type}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<List<RoomResponseDto>> getAvailableRoomsByType(@PathVariable RoomType type) {
        return ResponseEntity.ok(roomService.getAvailableRoomsByType(type).stream()
                .map(DtoMapper::toRoomResponseDto)
                .toList());
    }

    @GetMapping("/{id}/availability")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR", "AUDITOR", "FINANCE_OFFICER"})
    public ResponseEntity<Boolean> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        Room room = roomService.getRoomById(id);
        boolean isAvailable = room.getStatus() == RoomStatus.AVAILABLE;
        return ResponseEntity.ok(isAvailable);
    }

    @PostMapping
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<RoomResponseDto> createRoom(@Valid @RequestBody RoomRequestDto roomRequestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(DtoMapper.toRoomResponseDto(roomService.createRoom(DtoMapper.toRoom(roomRequestDto))));
    }

    @PutMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR", "MANAGER"})
    public ResponseEntity<RoomResponseDto> updateRoom(@PathVariable Long id, @Valid @RequestBody RoomRequestDto roomRequestDto) {
        return ResponseEntity.ok(DtoMapper.toRoomResponseDto(roomService.updateRoom(id, DtoMapper.toRoom(roomRequestDto))));
    }

    @PatchMapping("/{id}/status")
    @RoleRequired({"FRONT_DESK_STAFF", "HOUSEKEEPING_STAFF", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<RoomResponseDto> updateRoomStatus(@PathVariable Long id, @RequestParam RoomStatus status) {
        return ResponseEntity.ok(DtoMapper.toRoomResponseDto(roomService.updateRoomStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}