package com.cognizant.billing.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservationDto {
    private Long resId;
    private Long guestId;
    private Long roomId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String status;

    /**
     * Room rate. We try to read this directly from the reservation response
     * (the upstream service may embed a Room object). If null, we'll fetch the room
     * separately from room-service.
     */
    private BigDecimal ratePerNight;

    /**
     * If guest-reservation-service returns an embedded room object,
     * this picks up its ratePerNight.
     */
    private EmbeddedRoom room;

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EmbeddedRoom {
        private Long roomId;
        private String number;
        private String type;
        private BigDecimal ratePerNight;
    }
}
