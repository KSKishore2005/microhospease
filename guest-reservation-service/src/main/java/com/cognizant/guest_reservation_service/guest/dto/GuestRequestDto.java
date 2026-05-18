package com.cognizant.guest_reservation_service.guest.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Request payload for creating or updating a Guest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestRequestDto {

    @NotBlank(message = "Guest name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Size(max = 150, message = "Email must be at most 150 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+]?[0-9]{7,15}$", message = "Phone must be 7-15 digits, optionally starting with '+'")
    private String phone;

    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dob;

    @Size(max = 50, message = "Loyalty tier must be at most 50 characters")
    private String loyaltyTier;

    @Size(max = 50, message = "Status must be at most 50 characters")
    private String status;

    @Size(max = 200, message = "Address line 1 must be at most 200 characters")
    private String addressLine1;

    @Size(max = 200, message = "Address line 2 must be at most 200 characters")
    private String addressLine2;

    @Size(max = 100, message = "City must be at most 100 characters")
    private String city;

    @Size(max = 10, message = "Postal code must be at most 10 characters")
    private String postalCode;

    @Size(max = 100, message = "Country must be at most 100 characters")
    private String country;
}
