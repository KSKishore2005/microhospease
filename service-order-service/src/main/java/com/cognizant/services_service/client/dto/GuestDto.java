package com.cognizant.services_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight projection of Guest from guest-reservation-service.
 * Only fields we actually need are declared; extra fields in the response are ignored.
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GuestDto {
    private Long guestId;
    private Long userId;
    private String name;
    private String email;
    private String loyaltyTier;
    private String status;
}
