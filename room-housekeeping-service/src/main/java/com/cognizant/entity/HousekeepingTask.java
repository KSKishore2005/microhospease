package com.cognizant.entity;

import com.cognizant.enums.HousekeepingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "housekeeping_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HousekeepingTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "assigned_to")
    private Long assignedToUserId;

    private LocalDateTime scheduledAt;

    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private HousekeepingStatus status = HousekeepingStatus.PENDING;
}
