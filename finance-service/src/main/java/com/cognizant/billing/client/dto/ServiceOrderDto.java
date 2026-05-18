package com.cognizant.billing.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ServiceOrderDto {
    private Long orderId;
    private Long guestId;
    private Long reservationId;
    private Long roomId;
    private String serviceType;
    private String description;
    private BigDecimal price;
    /** PENDING / IN_PROGRESS / COMPLETED / CANCELLED */
    private String status;
}
