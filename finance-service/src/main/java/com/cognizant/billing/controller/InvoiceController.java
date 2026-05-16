package com.cognizant.billing.controller;

import com.cognizant.billing.dto.InvoiceRequestDto;
import com.cognizant.billing.dto.InvoiceResponseDto;
import com.cognizant.billing.enums.InvoiceStatus;
import com.cognizant.billing.security.RoleRequired;
import com.cognizant.billing.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<InvoiceResponseDto>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/{id}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<InvoiceResponseDto> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @GetMapping("/guest/{guestId}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<InvoiceResponseDto>> getInvoicesByGuest(@PathVariable Long guestId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByGuest(guestId));
    }

    @GetMapping("/reservation/{reservationId}")
    @RoleRequired({"GUEST", "FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<InvoiceResponseDto> getInvoiceByReservation(@PathVariable Long reservationId) {
        return ResponseEntity.ok(invoiceService.getInvoiceByReservation(reservationId));
    }

    @GetMapping("/status/{status}")
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<InvoiceResponseDto>> getInvoicesByStatus(@PathVariable InvoiceStatus status) {
        return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
    }

    @PostMapping
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<InvoiceResponseDto> createInvoice(@Valid @RequestBody InvoiceRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(dto));
    }

    @PostMapping("/generate/{reservationId}")
    @RoleRequired({"FRONT_DESK_STAFF", "FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<InvoiceResponseDto> generateInvoiceForReservation(
            @PathVariable Long reservationId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.generateInvoiceForReservation(reservationId));
    }

    @PutMapping("/{id}")
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<InvoiceResponseDto> updateInvoice(
            @PathVariable Long id, @Valid @RequestBody InvoiceRequestDto dto) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, dto));
    }

    @PatchMapping("/{id}/pay")
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<InvoiceResponseDto> markAsPaid(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.markAsPaid(id));
    }

    @PatchMapping("/{id}/overdue")
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<InvoiceResponseDto> markAsOverdue(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.markAsOverdue(id));
    }

    @PatchMapping("/{id}/cancel")
    @RoleRequired({"FINANCE_OFFICER", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<InvoiceResponseDto> cancelInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}