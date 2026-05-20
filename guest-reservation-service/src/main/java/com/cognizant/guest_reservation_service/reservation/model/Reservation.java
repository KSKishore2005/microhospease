package com.cognizant.guest_reservation_service.reservation.model;

import com.cognizant.guest_reservation_service.guest.model.Guest;
import com.cognizant.guest_reservation_service.reservation.enums.ReservationStatus;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long resId;

    // EAGER: every reservation response includes guest fields (name, email) for the
    // frontend, so we always need the join. LAZY caused intermittent
    // LazyInitializationException when ReservationMapper serialized outside a tx.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @Column(nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private LocalDate checkOutDate;

    // Default at the entity level matches the mapper: new bookings start as
    // PENDING and the booking workflow / staff moves them to CONFIRMED.
    // Explicit length=32 so the column has headroom for the longest enum
    // constant. Without this, Hibernate may have created varchar(11) sized to
    // CHECKED_OUT, and adding new shorter values still works — but if the
    // database was created with the original 4-value enum and the column is an
    // actual MySQL ENUM() type, the existing schema needs the ALTER statement
    // from MIGRATIONS.md to accept the new value.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(length = 500)
    private String specialRequests;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime modifiedAt = LocalDateTime.now();

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.modifiedAt == null) this.modifiedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.modifiedAt = LocalDateTime.now();
    }
}