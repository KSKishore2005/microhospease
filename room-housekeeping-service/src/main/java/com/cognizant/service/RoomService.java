package com.cognizant.service;

import com.cognizant.entity.Room;
import com.cognizant.enums.RoomStatus;
import com.cognizant.enums.RoomType;
import com.cognizant.exception.BadRequestException;
import com.cognizant.exception.ResourceNotFoundException;
import com.cognizant.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
    }

    public List<Room> getAvailableRooms() {
        return roomRepository.findByStatus(RoomStatus.AVAILABLE);
    }

    public List<Room> getRoomsByType(RoomType type) {
        return roomRepository.findByType(type);
    }

    public List<Room> getAvailableRoomsByType(RoomType type) {
        return roomRepository.findByTypeAndStatus(type, RoomStatus.AVAILABLE);
    }

    public Room createRoom(Room room) {
        if (roomRepository.findByNumber(room.getNumber()).isPresent()) {
            throw new BadRequestException("Room with number " + room.getNumber() + " already exists.");
        }
        return roomRepository.save(room);
    }

    public Room updateRoom(Long id, Room updated) {
        Room existing = getRoomById(id);
        existing.setNumber(updated.getNumber());
        existing.setType(updated.getType());
        existing.setCapacity(updated.getCapacity());
        existing.setAmenitiesJson(updated.getAmenitiesJson());
        existing.setStatus(updated.getStatus());
        existing.setRatePerNight(updated.getRatePerNight());
        return roomRepository.save(existing);
    }

    /**
     * Updates a room's physical state. Transitions are validated against a state
     * machine so other services (reservation, housekeeping) cannot drive the room
     * into an invalid combination such as OCCUPIED + CLEANING simultaneously.
     *
     * Allowed transitions:
     *   AVAILABLE   → OCCUPIED | CLEANING | MAINTENANCE
     *   OCCUPIED    → CLEANING | MAINTENANCE | AVAILABLE (e.g. cancellation)
     *   CLEANING    → AVAILABLE | MAINTENANCE
     *   MAINTENANCE → AVAILABLE
     */
    public Room updateRoomStatus(Long id, RoomStatus status) {
        Room room = getRoomById(id);
        RoomStatus current = room.getStatus();
        if (current != null && current != status && !isValidTransition(current, status)) {
            throw new BadRequestException(
                    "Invalid room status transition: " + current + " -> " + status);
        }
        room.setStatus(status);
        return roomRepository.save(room);
    }

    private boolean isValidTransition(RoomStatus from, RoomStatus to) {
        // Same-state transitions are guarded by the equality check in the caller
        // (`current != status`), so listing them here would never be reached —
        // but listing MAINTENANCE explicitly is a defensive belt-and-braces in
        // case a caller forgets that guard.
        return switch (from) {
            case AVAILABLE   -> to == RoomStatus.OCCUPIED
                                || to == RoomStatus.CLEANING
                                || to == RoomStatus.MAINTENANCE;
            case OCCUPIED    -> to == RoomStatus.CLEANING
                                || to == RoomStatus.MAINTENANCE
                                || to == RoomStatus.AVAILABLE;
            case CLEANING    -> to == RoomStatus.AVAILABLE
                                || to == RoomStatus.MAINTENANCE;
            case MAINTENANCE -> to == RoomStatus.AVAILABLE
                                || to == RoomStatus.MAINTENANCE;
        };
    }

    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        roomRepository.delete(room);
    }
}

