package com.cognizant.guest_reservation_service.guest.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Guest entity – core domain object for the guest bounded context.
 *
 * <p>Design note for future microservice split:
 * When extracting into a dedicated Guest-Service, this entity and its
 * repository become the entire persistence layer of that service. The
 * {@code reservations} collection is intentionally marked with
 * {@code mappedBy} so Reservation owns the FK – making the split trivial
 * (just drop the collection and switch to a Feign/REST call).
 */
@Entity
@Table(name = "guests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long guestId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    private LocalDate dob;

    @Column(length = 50)
    @Builder.Default
    private String loyaltyTier = "STANDARD";

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "address_line1", length = 200)
    private String addressLine1;

    @Column(name = "address_line2", length = 200)
    private String addressLine2;

    @Column(length = 100)
    private String city;

    @Column(length = 10)
    private String postalCode;

    @Column(length = 100)
    private String country;

    /**
     * Reservations side owns the FK. We deliberately do NOT cascade DELETE here —
     * deleting a guest that still has active or historical reservations would
     * destroy audit trail, finance reconciliation, and room occupancy state.
     * GuestService.deleteGuest must refuse the delete if any active reservation
     * exists.
     */
    @OneToMany(mappedBy = "guest", cascade = CascadeType.PERSIST, orphanRemoval = false, fetch = FetchType.LAZY)
    @Builder.Default
    private List<com.cognizant.guest_reservation_service.reservation.model.Reservation> reservations = new ArrayList<>();

    // @PrePersist sets these — do NOT use @Builder.Default to avoid the builder
    // overwriting the entity at INSERT time with a value computed before the
    // session was attached (root cause of the historic "null id in Guest entry"
    // Hibernate error when a save was retried after a failed insert).
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
