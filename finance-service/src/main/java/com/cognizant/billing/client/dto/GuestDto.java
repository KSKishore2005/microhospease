package com.cognizant.billing.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GuestDto {
    private Long guestId;
    private String name;
    private String loyaltyTier;
    private String status;
}
