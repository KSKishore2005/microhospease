package com.cognizant.billing.dto;

import com.cognizant.billing.enums.PaymentMethod;
import com.cognizant.billing.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDto {
    private Long paymentId;
    private Long invoiceId;
    private Long guestId;
    private BigDecimal amount;
    private PaymentMethod method;
    private LocalDateTime paidAt;
    private PaymentStatus status;
}
