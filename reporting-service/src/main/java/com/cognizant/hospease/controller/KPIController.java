package com.cognizant.hospease.controller;

import com.cognizant.hospease.dto.KPIRequestDto;
import com.cognizant.hospease.dto.KPIResponseDto;
import com.cognizant.hospease.security.RoleRequired;
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
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<KPIResponseDto>> getAllKPIs() {
        return ResponseEntity.ok(kpiService.getAllKPIs());
    }

    @GetMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<KPIResponseDto> getKPIById(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.getKPIById(id));
    }

    @GetMapping("/period/{period}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
    public ResponseEntity<List<KPIResponseDto>> getKPIsByPeriod(@PathVariable String period) {
        return ResponseEntity.ok(kpiService.getKPIsByPeriod(period));
    }

    @PostMapping
    @RoleRequired({"MANAGER", "ADMINISTRATOR","AUDITOR"})
    public ResponseEntity<KPIResponseDto> createKPI(@Valid @RequestBody KPIRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kpiService.createKPI(dto));
    }

    @PutMapping("/{id}")
    @RoleRequired({"MANAGER", "ADMINISTRATOR","AUDITOR"})
    public ResponseEntity<KPIResponseDto> updateKPI(@PathVariable Long id,
                                                    @Valid @RequestBody KPIRequestDto dto) {
        return ResponseEntity.ok(kpiService.updateKPI(id, dto));
    }

    @PostMapping("/{id}/calculate-occupancy")
    @RoleRequired({"MANAGER", "ADMINISTRATOR","AUDITOR"})
    public ResponseEntity<KPIResponseDto> triggerOccupancyCalc(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.calculateOccupancyRate(id));
    }

    @PostMapping("/{id}/calculate-revenue")
    @RoleRequired({"MANAGER", "ADMINISTRATOR","AUDITOR"})
    public ResponseEntity<KPIResponseDto> triggerRevenueCalc(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.calculateRevenue(id));
    }

    @PostMapping("/{id}/calculate-collection-rate")
    @RoleRequired({"MANAGER", "ADMINISTRATOR","AUDITOR"})
    public ResponseEntity<KPIResponseDto> triggerCollectionCalc(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.calculatePaymentCollectionRate(id));
    }

    @DeleteMapping("/{id}")
    @RoleRequired({"ADMINISTRATOR"})
    public ResponseEntity<Void> deleteKPI(@PathVariable Long id) {
        kpiService.deleteKPI(id);
        return ResponseEntity.noContent().build();
    }
}