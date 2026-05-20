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

    /** Display name — frontend sends/expects staff.name */
    @Column(length = 150)
    private String name;

    // length=40 fits the longest UserRole value (RESTAURANT_SERVICE_STAFF = 25)
    // with comfortable headroom. The original enum was {ADMIN, MANAGER, STAFF,
    // HOUSEKEEPER} so Hibernate auto-sized the column to varchar(11) which
    // truncates any longer role added later — see MIGRATIONS.md.
    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private UserRole role;

    private String department;

    /** Direct phone column — replaces contactInfoJson for new records */
    @Column(length = 30)
    private String phone;

    @Column(length = 150)
    private String email;

    /** ISO date string "2024-01-15" — stored as text for simplicity */
    @Column(name = "hire_date", length = 20)
    private String hireDate;

    @Column(columnDefinition = "TEXT")
    private String contactInfoJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private StaffStatus status = StaffStatus.ACTIVE;
}
