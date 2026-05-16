package com.cognizant.services_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_orders",
        indexes = {
                @Index(name = "idx_service_orders_guest", columnList = "guestId"),
                @Index(name = "idx_service_orders_reservation", columnList = "reservationId"),
                @Index(name = "idx_service_orders_room", columnList = "roomId"),
                @Index(name = "idx_service_orders_status", columnList = "status")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;

    @Column(nullable = false)
    private Long guestId;

    /**
     * NEW: Links the service order to a specific reservation.
     * Required so finance-service can roll service charges into the correct invoice.
     */
    @Column(nullable = false)
    private Long reservationId;

    @Column(nullable = false)
    private Long roomId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ServiceType serviceType;

    @Column(length = 500)
    private String description;

    /**
     * NEW: Price/amount of the service order so finance-service can roll it up.
     * Stored as DECIMAL(12,2) to match typical money handling.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ServiceOrderStatus status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
