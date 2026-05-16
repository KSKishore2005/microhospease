package com.cognizant.billing.entity;

import com.cognizant.billing.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices",
        indexes = {
                @Index(name = "idx_invoices_guest", columnList = "guest_id"),
                @Index(name = "idx_invoices_reservation", columnList = "reservation_id", unique = true),
                @Index(name = "idx_invoices_status", columnList = "status")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long invoiceId;

    @Column(name = "guest_id", nullable = false)
    private Long guestId;

    /**
     * One invoice per reservation. Unique constraint prevents accidental double-invoicing.
     */
    @Column(name = "reservation_id", unique = true)
    private Long reservationId;

    @Column(columnDefinition = "TEXT")
    private String lineItemsJson;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "USD";

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 32)
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    private String invoiceUri;
}
