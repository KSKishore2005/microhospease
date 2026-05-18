package com.cognizant.guest_reservation_service.reservation.repository;

import com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus;
import com.cognizant.guest_reservation_service.reservation.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByGuest_GuestId(Long guestId);

    List<Reservation> findByStatus(ReservationStatus status);

    List<Reservation> findByRoomId(Long roomId);

    /**
     * Finds overlapping reservations for a given roomId with active statuses.
     * Used to prevent double-booking.
     */
    @Query("""
            SELECT r FROM Reservation r
            WHERE r.roomId = :roomId
              AND r.status IN :statuses
              AND r.checkInDate  < :checkOut
              AND r.checkOutDate > :checkIn
            """)
    List<Reservation> findConflicting(
            @Param("roomId") Long roomId,
            @Param("statuses") List<ReservationStatus> statuses,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut);
}