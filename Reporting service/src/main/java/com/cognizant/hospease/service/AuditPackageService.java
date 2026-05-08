package com.cognizant.hospease.service;

import com.cognizant.hospease.client.OperationalClient;
import com.cognizant.hospease.dto.AuditPackageRequestDto;
import com.cognizant.hospease.dto.AuditPackageResponseDto;
import com.cognizant.hospease.dto.DtoMapper;
import com.cognizant.hospease.entity.AuditPackage;
import com.cognizant.hospease.exception.BadRequestException;
import com.cognizant.hospease.exception.ResourceNotFoundException;
import com.cognizant.hospease.repository.AuditPackageRepository;
import com.cognizant.hospease.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditPackageService {

    private final AuditPackageRepository auditPackageRepository;
    private final PdfGeneratorService pdfGenerator;
    private final ReportRepository reportRepository;
    private final OperationalClient operationalClient;

    @Transactional
    public AuditPackageResponseDto createMonthlyAudit(LocalDate start, LocalDate end) {
        long totalReports = reportRepository.count();
        long totalShifts = operationalClient.getShiftCount();

        String contents = String.format(
                "{\"Total_Shifts\": %d, \"Total_Reports_Generated\": %d, \"Compliance_Status\": \"PASSED\"}",
                totalShifts, totalReports
        );

        String fileName = "AUDIT_" + start + "_TO_" + end + ".pdf";
        String uri;
        try {
            uri = pdfGenerator.generateOccupancyReport(fileName, "Master Audit",
                    "Period: " + start + " to " + end, contents);
        } catch (Exception e) {
            throw new RuntimeException("Audit PDF Generation failed: " + e.getMessage());
        }

        AuditPackage pkg = AuditPackage.builder()
                .periodStart(start)
                .periodEnd(end)
                .contentsJson(contents)
                .packageUri(uri)
                .generatedAt(LocalDateTime.now())
                .build();

        return DtoMapper.toAuditPackageResponseDto(auditPackageRepository.save(pkg));
    }

    public List<AuditPackageResponseDto> getAllPackages() {
        return DtoMapper.toAuditPackageResponseDtoList(auditPackageRepository.findAll());
    }

    public AuditPackageResponseDto getPackageById(Long id) {
        AuditPackage pkg = auditPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditPackage", "id", id));
        return DtoMapper.toAuditPackageResponseDto(pkg);
    }

    public AuditPackageResponseDto createPackage(AuditPackageRequestDto dto) {
        // 1. Validation check
        if (dto.getPeriodEnd() != null && dto.getPeriodStart() != null
                && !dto.getPeriodEnd().isAfter(dto.getPeriodStart())) {
            throw new BadRequestException("Period end must be after period start.");
        }

        // 2. Generate PDF and File Path
        String fileName = "AUDIT_" + dto.getPeriodStart() + "_" + System.currentTimeMillis() + ".pdf";
        String uri;
        String contents = dto.getContentsJson() != null ? dto.getContentsJson() : "{\"Status\": \"Manual Audit Generated\"}";

        try {
            // Calling the generator we fixed earlier
            uri = pdfGenerator.generateOccupancyReport(
                    fileName,
                    "Manual Audit",
                    "Period: " + dto.getPeriodStart() + " to " + dto.getPeriodEnd(),
                    contents
            );
        } catch (Exception e) {
            throw new RuntimeException("Audit PDF Generation failed: " + e.getMessage());
        }

        // 3. Map DTO to Entity and set the generated values
        AuditPackage pkg = DtoMapper.toAuditPackage(dto);
        pkg.setGeneratedAt(LocalDateTime.now());
        pkg.setPackageUri(uri);      // Now it won't be null
        pkg.setContentsJson(contents); // Now it won't be null

        return DtoMapper.toAuditPackageResponseDto(auditPackageRepository.save(pkg));
    }

    public AuditPackageResponseDto updatePackage(Long id, AuditPackageRequestDto updatedDto) {
        AuditPackage existing = auditPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditPackage", "id", id));

        existing.setPeriodStart(updatedDto.getPeriodStart());
        existing.setPeriodEnd(updatedDto.getPeriodEnd());
        existing.setContentsJson(updatedDto.getContentsJson());
        existing.setPackageUri(updatedDto.getPackageUri());

        return DtoMapper.toAuditPackageResponseDto(auditPackageRepository.save(existing));
    }

    public void deletePackage(Long id) {
        AuditPackage pkg = auditPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditPackage", "id", id));
        auditPackageRepository.delete(pkg);
    }
}