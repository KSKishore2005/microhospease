package com.cognizant.entity;

import com.cognizant.enums.ShiftStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "shifts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long shiftId;

    /** EAGER — avoids LazyInitializationException when serializing outside a tx */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(name = "assigned_by")
    private Long assignedByUserId;

    /** MORNING | AFTERNOON | NIGHT — frontend StaffScheduling reads shift.shiftType */
    @Column(name = "shift_type", length = 20)
    private String shiftType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private ShiftStatus status = ShiftStatus.SCHEDULED;
}
