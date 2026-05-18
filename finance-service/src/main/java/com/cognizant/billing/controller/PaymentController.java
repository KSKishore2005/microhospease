package com.cognizant.billing.controller;

import com.cognizant.billing.dto.DtoMapper;
import com.cognizant.billing.dto.PaymentRequestDto;
import com.cognizant.billing.dto.PaymentResponseDto;
import com.cognizant.billing.entity.Payment;
import com.cognizant.billing.security.RoleRequired;
import com.cognizant.billing.service.PaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<PaymentResponseDto>> getAllPayments() {
        return ResponseEntity.ok(DtoMapper.toPaymentResponseDtoList(paymentService.getAllPayments()));
    }

    @GetMapping("/{id}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<PaymentResponseDto> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toPaymentResponseDto(paymentService.getPaymentById(id)));
    }

    @GetMapping("/invoice/{invoiceId}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByInvoice(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(
                DtoMapper.toPaymentResponseDtoList(paymentService.getPaymentsByInvoice(invoiceId)));
    }

    @GetMapping("/guest/{guestId}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByGuest(@PathVariable Long guestId) {
        return ResponseEntity.ok(
                DtoMapper.toPaymentResponseDtoList(paymentService.getPaymentsByGuest(guestId)));
    }

    @PostMapping
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<PaymentResponseDto> createPayment(
            @Valid @RequestBody PaymentRequestDto dto,
            @RequestParam @Positive Long invoiceId,
            @RequestParam @Positive Long guestId) {
        Payment entity = DtoMapper.toPayment(dto);
        Payment created = paymentService.createPayment(entity, invoiceId, guestId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(DtoMapper.toPaymentResponseDto(created));
    }

    @PutMapping("/{id}")
    @RoleRequired({"FINANCE_OFFICER", "ADMINISTRATOR"})
    public ResponseEntity<PaymentResponseDto> updatePayment(
            @PathVariable Long id, @Valid @RequestBody PaymentRequestDto dto) {
        Payment entity = DtoMapper.toPayment(dto);
        Payment updated = paymentService.updatePayment(id, entity);
        return ResponseEntity.ok(DtoMapper.toPaymentResponseDto(updated));
    }

    @PatchMapping("/{id}/refund")
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<PaymentResponseDto> refundPayment(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toPaymentResponseDto(paymentService.refundPayment(id)));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }
}