package com.cognizant.guest_reservation_service.guest.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response payload for Guest queries.
 * No sensitive internal details (e.g. no JPA metadata) are exposed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestResponseDto {

    private Long guestId;
    private String name;
    private String email;
    private String phone;
    private LocalDate dob;
    private String loyaltyTier;
    private String status;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String postalCode;
    private String country;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
