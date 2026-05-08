package com.cognizant.hospease.service;

import com.cognizant.hospease.client.RoomClient;
import com.cognizant.hospease.client.OperationalClient;
import com.cognizant.hospease.dto.KPIRequestDto;
import com.cognizant.hospease.dto.KPIResponseDto;
import com.cognizant.hospease.entity.KPI;
import com.cognizant.hospease.exception.ResourceNotFoundException;
import com.cognizant.hospease.repository.KPIRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class KPIService {

    private final KPIRepository kpiRepository;

    // Inject the Microservice Clients instead of local repositories
    private final RoomClient roomClient;
    private final OperationalClient operationalClient;

    public List<KPIResponseDto> getAllKPIs() {
        return kpiRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public KPIResponseDto getKPIById(Long id) {
        KPI kpi = kpiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KPI", "id", id));
        return mapToResponseDTO(kpi);
    }

    public List<KPIResponseDto> getKPIsByPeriod(String period) {
        return kpiRepository.findByReportingPeriod(period).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public KPIResponseDto createKPI(KPIRequestDto dto) {
        KPI kpi = KPI.builder()
                .name(dto.getName())
                .definition(dto.getDefinition())
                .target(dto.getTarget())
                .currentValue(dto.getCurrentValue())
                .reportingPeriod(dto.getReportingPeriod())
                .build();
        return mapToResponseDTO(kpiRepository.save(kpi));
    }

    public KPIResponseDto updateKPI(Long id, KPIRequestDto dto) {
        KPI existing = kpiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KPI", "id", id));

        existing.setName(dto.getName());
        existing.setDefinition(dto.getDefinition());
        existing.setTarget(dto.getTarget());
        existing.setCurrentValue(dto.getCurrentValue());
        existing.setReportingPeriod(dto.getReportingPeriod());

        return mapToResponseDTO(kpiRepository.save(existing));
    }

    @Transactional
    public KPIResponseDto calculateStaffEfficiency(Long kpiId) {
        KPI kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI", "id", kpiId));

        // Fetch shift count from the teammate's Operational Service
        long totalShifts = operationalClient.getShiftCount();

        if (totalShifts > 0) {
            // Simplified calculation example for microservice
            BigDecimal efficiency = BigDecimal.valueOf(totalShifts)
                    .setScale(2, RoundingMode.HALF_UP);
            kpi.setCurrentValue(efficiency);
        }
        return mapToResponseDTO(kpiRepository.save(kpi));
    }

    @Transactional
    public KPIResponseDto calculateOccupancyRate(Long kpiId) {
        KPI kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI", "id", kpiId));

        // Fetch counts from the teammate's Room Service via Feign
        long totalRooms = roomClient.getTotalRoomCount();
        long occupiedRooms = roomClient.getOccupiedRoomCount();

        if (totalRooms > 0) {
            BigDecimal occupancy = BigDecimal.valueOf((double) occupiedRooms / totalRooms * 100)
                    .setScale(2, RoundingMode.HALF_UP);
            kpi.setCurrentValue(occupancy);
        }
        return mapToResponseDTO(kpiRepository.save(kpi));
    }

    public void deleteKPI(Long id) {
        KPI kpi = kpiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KPI", "id", id));
        kpiRepository.delete(kpi);
    }

    private KPIResponseDto mapToResponseDTO(KPI kpi) {
        return KPIResponseDto.builder()
                .kpiId(kpi.getKpiId())
                .name(kpi.getName())
                .definition(kpi.getDefinition())
                .target(kpi.getTarget())
                .currentValue(kpi.getCurrentValue())
                .reportingPeriod(kpi.getReportingPeriod())
                .build();
    }
}