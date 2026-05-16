package com.cognizant.entity;

import com.cognizant.enums.StaffStatus;
import com.cognizant.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "staff")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long staffId;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    private String department;

    @Column(columnDefinition = "TEXT")
    private String contactInfoJson;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StaffStatus status = StaffStatus.ACTIVE;
}
