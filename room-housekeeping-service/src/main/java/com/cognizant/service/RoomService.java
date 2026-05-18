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

    public Room updateRoomStatus(Long id, RoomStatus status) {
        Room room = getRoomById(id);
        room.setStatus(status);
        return roomRepository.save(room);
    }

    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        roomRepository.delete(room);
    }
}

