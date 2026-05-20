package com.cognizant.guest_reservation_service.guest.repository;

import com.cognizant.guest_reservation_service.guest.model.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Guest persistence operations.
 *
 * <p>Future microservice split: extract this interface and the Guest entity
 * into a dedicated guest-service module without any changes to the contract.
 */
@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {

    /** Case-insensitive — email is treated as a unique identifier. */
    Optional<Guest> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    /** Kept for backward compatibility with any callers expecting an exact match. */
    Optional<Guest> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Guest> findByLoyaltyTier(String loyaltyTier);

    List<Guest> findByStatus(String status);
}
