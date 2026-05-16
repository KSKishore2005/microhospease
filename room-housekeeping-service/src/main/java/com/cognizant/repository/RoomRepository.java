package com.cognizant.repository;

import com.cognizant.entity.Room;
import com.cognizant.enums.RoomStatus;
import com.cognizant.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByNumber(String number);
    List<Room> findByStatus(RoomStatus status);
    List<Room> findByType(RoomType type);
    List<Room> findByTypeAndStatus(RoomType type, RoomStatus status);
}
