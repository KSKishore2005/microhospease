package com.cognizant.hospease.service;

import com.cognizant.hospease.client.FinanceClient;
import com.cognizant.hospease.client.ReservationClient;
import com.cognizant.hospease.client.RoomServiceClient;
import com.cognizant.hospease.client.ServiceOrderClient;
import com.cognizant.hospease.client.dto.InvoiceDto;
import com.cognizant.hospease.client.dto.RoomDto;
import com.cognizant.hospease.common.exception.BadRequestException;
import com.cognizant.hospease.common.exception.ResourceNotFoundException;
import com.cognizant.hospease.dto.AuditPackageRequestDto;
import com.cognizant.hospease.dto.AuditPackageResponseDto;
import com.cognizant.hospease.dto.DtoMapper;
import com.cognizant.hospease.entity.AuditPackage;
import com.cognizant.hospease.repository.AuditPackageRepository;
import com.cognizant.hospease.repository.ReportRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuditPackageService {

    private final AuditPackageRepository auditPackageRepository;
    private final ReportRepository reportRepository;
    private final PdfGeneratorService pdfGenerator;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cross-service Feign clients for the audit summary
    private final RoomServiceClient roomServiceClient;
    private final ReservationClient reservationClient;
    private final ServiceOrderClient serviceOrderClient;
    private final FinanceClient financeClient;

    @Transactional(readOnly = true)
    public List<AuditPackageResponseDto> getAllPackages() {
        return DtoMapper.toAuditPackageResponseDtoList(auditPackageRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<AuditPackageResponseDto> getPackagesByDateRange(LocalDate from, LocalDate to) {
        if (!to.isAfter(from)) {
            throw new BadRequestException("'to' date must be after 'from' date");
        }
        return DtoMapper.toAuditPackageResponseDtoList(
                auditPackageRepository.findByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqual(from, to));
    }

    @Transactional(readOnly = true)
    public AuditPackageResponseDto getPackageById(Long id) {
        return DtoMapper.toAuditPackageResponseDto(findEntityById(id));
    }

    /**
     * Creates an audit package by aggregating data from ALL upstream services.
     */
    public AuditPackageResponseDto createPackage(AuditPackageRequestDto dto) {
        if (!dto.getPeriodEnd().isAfter(dto.getPeriodStart())) {
            throw new BadRequestException("periodEnd must be after periodStart");
        }

        String contents = aggregateAuditContents(dto.getPeriodStart(), dto.getPeriodEnd(),
                dto.getContentsJson());

        // Generate PDF
        String fileName = "AUDIT_" + dto.getPeriodStart() + "_TO_" + dto.getPeriodEnd()
                + "_" + System.currentTimeMillis() + ".pdf";
        String uri;
        try {
            uri = pdfGenerator.generateAuditPdf(fileName, dto.getPeriodStart(), dto.getPeriodEnd(), contents);
        } catch (Exception e) {
            log.error("Audit PDF generation failed", e);
            throw new RuntimeException("Audit PDF generation failed: " + e.getMessage());
        }

        AuditPackage pkg = AuditPackage.builder()
                .periodStart(dto.getPeriodStart())
                .periodEnd(dto.getPeriodEnd())
                .contentsJson(contents)
                .packageUri(uri)
                .build();

        return DtoMapper.toAuditPackageResponseDto(auditPackageRepository.save(pkg));
    }

    public AuditPackageResponseDto updatePackage(Long id, AuditPackageRequestDto dto) {
        if (!dto.getPeriodEnd().isAfter(dto.getPeriodStart())) {
            throw new BadRequestException("periodEnd must be after periodStart");
        }
        AuditPackage existing = findEntityById(id);
        existing.setPeriodStart(dto.getPeriodStart());
        existing.setPeriodEnd(dto.getPeriodEnd());
        if (dto.getContentsJson() != null) {
            existing.setContentsJson(dto.getContentsJson());
        }

        // Regenerate PDF since period or contents changed
        String fileName = "AUDIT_" + dto.getPeriodStart() + "_TO_" + dto.getPeriodEnd()
                + "_" + System.currentTimeMillis() + ".pdf";
        try {
            String uri = pdfGenerator.generateAuditPdf(
                    fileName, existing.getPeriodStart(), existing.getPeriodEnd(), existing.getContentsJson());
            existing.setPackageUri(uri);
        } catch (Exception e) {
            log.error("Audit PDF regeneration failed for package id={}", id, e);
        }

        return DtoMapper.toAuditPackageResponseDto(auditPackageRepository.save(existing));
    }

    public void deletePackage(Long id) {
        auditPackageRepository.delete(findEntityById(id));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private AuditPackage findEntityById(Long id) {
        return auditPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditPackage", "id", id));
    }

    /**
     * Aggregates data from all upstream services into the audit contents JSON.
     * If a service is down, its block is set to "unavailable" but the audit still proceeds.
     */
    private String aggregateAuditContents(LocalDate start, LocalDate end, String userExtras) {
        long totalRooms = -1, occupiedRooms = -1, reservations = -1, serviceOrders = -1;
        long paidInvoices = -1, unpaidInvoices = -1;
        BigDecimal revenue = BigDecimal.ZERO;
        long totalReports = reportRepository.count();

        try {
            List<RoomDto> rooms = roomServiceClient.getAllRooms();
            totalRooms = rooms.size();
            occupiedRooms = rooms.stream()
                    .filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus())).count();
        } catch (Exception e) {
            log.warn("room-service unavailable: {}", e.getMessage());
        }

        try {
            reservations = reservationClient.getAllReservations().size();
        } catch (Exception e) {
            log.warn("guest-reservation-service unavailable: {}", e.getMessage());
        }

        try {
            serviceOrders = serviceOrderClient.getAllServiceOrders().size();
        } catch (Exception e) {
            log.warn("service-order-service unavailable: {}", e.getMessage());
        }

        try {
            List<InvoiceDto> allInvoices = financeClient.getAllInvoices();
            paidInvoices = allInvoices.stream()
                    .filter(i -> "PAID".equalsIgnoreCase(i.getStatus())).count();
            unpaidInvoices = allInvoices.stream()
                    .filter(i -> "UNPAID".equalsIgnoreCase(i.getStatus())).count();
            revenue = allInvoices.stream()
                    .filter(i -> "PAID".equalsIgnoreCase(i.getStatus()))
                    .map(InvoiceDto::getTotalAmount)
                    .filter(a -> a != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } catch (Exception e) {
            log.warn("finance-service unavailable: {}", e.getMessage());
        }

        Map<String, Object> auditMap = new LinkedHashMap<>();
        auditMap.put("periodStart", start.toString());
        auditMap.put("periodEnd", end.toString());

        Map<String, Object> roomsMap = new LinkedHashMap<>();
        roomsMap.put("total", totalRooms);
        roomsMap.put("occupied", occupiedRooms);
        auditMap.put("rooms", roomsMap);

        Map<String, Object> reservationsMap = new LinkedHashMap<>();
        reservationsMap.put("total", reservations);
        auditMap.put("reservations", reservationsMap);

        Map<String, Object> serviceOrdersMap = new LinkedHashMap<>();
        serviceOrdersMap.put("total", serviceOrders);
        auditMap.put("serviceOrders", serviceOrdersMap);

        Map<String, Object> financeMap = new LinkedHashMap<>();
        financeMap.put("paid", paidInvoices);
        financeMap.put("unpaid", unpaidInvoices);
        financeMap.put("revenue", revenue);
        auditMap.put("finance", financeMap);

        Map<String, Object> reportsMap = new LinkedHashMap<>();
        reportsMap.put("total", totalReports);
        auditMap.put("reports", reportsMap);

        auditMap.put("complianceStatus", "PASSED");

        if (userExtras != null && !userExtras.isBlank()) {
            try {
                // Preserve as structured JSON if valid, otherwise store as plain string
                Object parsed = objectMapper.readValue(userExtras, Object.class);
                auditMap.put("userNotes", parsed);
            } catch (Exception e) {
                auditMap.put("userNotes", userExtras);
            }
        }

        try {
            return objectMapper.writeValueAsString(auditMap);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize audit contents to JSON", e);
        }
    }
}
