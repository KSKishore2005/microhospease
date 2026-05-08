package com.cognizant.hospease.controller;

import com.cognizant.hospease.dto.KPIRequestDto;
import com.cognizant.hospease.dto.KPIResponseDto;
import com.cognizant.hospease.service.KPIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kpis")
@RequiredArgsConstructor
public class KPIController {

    private final KPIService kpiService;

    @GetMapping
    public ResponseEntity<List<KPIResponseDto>> getAllKPIs() {
        return ResponseEntity.ok(kpiService.getAllKPIs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<KPIResponseDto> getKPIById(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.getKPIById(id));
    }

    @PostMapping
    public ResponseEntity<KPIResponseDto> createKPI(@Valid @RequestBody KPIRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kpiService.createKPI(requestDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KPIResponseDto> updateKPI(@PathVariable Long id, @Valid @RequestBody KPIRequestDto requestDto) {
        return ResponseEntity.ok(kpiService.updateKPI(id, requestDto));
    }

    @PostMapping("/{id}/calculate")
    public ResponseEntity<KPIResponseDto> calculateKPI(@PathVariable Long id) {
        // Logic to decide which calculation to run based on the KPI ID or Name
        KPIResponseDto kpi = kpiService.getKPIById(id);

        if ("Occupancy Rate".equalsIgnoreCase(kpi.getName())) {
            return ResponseEntity.ok(kpiService.calculateOccupancyRate(id));
        } else {
            // Default to efficiency for other KPIs like Staff Productivity
            return ResponseEntity.ok(kpiService.calculateStaffEfficiency(id));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKPI(@PathVariable Long id) {
        kpiService.deleteKPI(id);
        return ResponseEntity.noContent().build();
    }
}