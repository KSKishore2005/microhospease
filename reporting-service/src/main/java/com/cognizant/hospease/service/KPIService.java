package com.cognizant.hospease.service;

import com.cognizant.hospease.client.FinanceClient;
import com.cognizant.hospease.client.RoomServiceClient;
import com.cognizant.hospease.client.dto.InvoiceDto;
import com.cognizant.hospease.client.dto.RoomDto;
import com.cognizant.hospease.common.exception.ResourceNotFoundException;
import com.cognizant.hospease.dto.DtoMapper;
import com.cognizant.hospease.dto.KPIRequestDto;
import com.cognizant.hospease.dto.KPIResponseDto;
import com.cognizant.hospease.entity.KPI;
import com.cognizant.hospease.repository.KPIRepository;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class KPIService {

    private final KPIRepository kpiRepository;
    private final RoomServiceClient roomServiceClient;
    private final FinanceClient financeClient;

    @Transactional(readOnly = true)
    public List<KPIResponseDto> getAllKPIs() {
        return kpiRepository.findAll().stream()
                .map(DtoMapper::toKPIResponseDto).toList();
    }

    @Transactional(readOnly = true)
    public KPIResponseDto getKPIById(Long id) {
        return DtoMapper.toKPIResponseDto(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<KPIResponseDto> getKPIsByPeriod(String period) {
        return kpiRepository.findByReportingPeriod(period).stream()
                .map(DtoMapper::toKPIResponseDto).toList();
    }

    public KPIResponseDto createKPI(KPIRequestDto dto) {
        KPI kpi = KPI.builder()
                .name(dto.getName())
                .definition(dto.getDefinition())
                .target(dto.getTarget())
                .currentValue(dto.getCurrentValue())
                .reportingPeriod(dto.getReportingPeriod())
                .build();
        return DtoMapper.toKPIResponseDto(kpiRepository.save(kpi));
    }

    public KPIResponseDto updateKPI(Long id, KPIRequestDto dto) {
        KPI existing = findEntityById(id);
        existing.setName(dto.getName());
        existing.setDefinition(dto.getDefinition());
        existing.setTarget(dto.getTarget());
        existing.setCurrentValue(dto.getCurrentValue());
        existing.setReportingPeriod(dto.getReportingPeriod());
        return DtoMapper.toKPIResponseDto(kpiRepository.save(existing));
    }

    /**
     * Calculates occupancy rate from room-service data:
     * occupiedRooms / totalRooms * 100
     */
    @RateLimiter(name = "kpiCalculation", fallbackMethod = "kpiRateLimitFallback")
    public KPIResponseDto calculateOccupancyRate(Long kpiId) {
        KPI kpi = findEntityById(kpiId);
        try {
            List<RoomDto> rooms = roomServiceClient.getAllRooms();
            long total = rooms.size();
            long occupied = rooms.stream()
                    .filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus()))
                    .count();

            if (total > 0) {
                BigDecimal occupancy = BigDecimal.valueOf((double) occupied / total * 100)
                        .setScale(2, RoundingMode.HALF_UP);
                kpi.setCurrentValue(occupancy);
                log.info("Occupancy for KPI {}: {}/{} = {}%", kpiId, occupied, total, occupancy);
            } else {
                log.warn("No rooms returned from room-service for KPI {}", kpiId);
                throw new RuntimeException("Occupancy calculation skipped: no room data available");
            }
            return DtoMapper.toKPIResponseDto(kpiRepository.save(kpi));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to compute occupancy for KPI {}: {}", kpiId, e.getMessage());
            throw new RuntimeException("Occupancy calculation failed: room-service unavailable", e);
        }
    }

    /**
     * Calculates total paid revenue from finance-service.
     */
    @RateLimiter(name = "kpiCalculation", fallbackMethod = "kpiRateLimitFallback")
    public KPIResponseDto calculateRevenue(Long kpiId) {
        KPI kpi = findEntityById(kpiId);
        try {
            List<InvoiceDto> paidInvoices = financeClient.getInvoicesByStatus("PAID");
            BigDecimal revenue = paidInvoices.stream()
                    .map(InvoiceDto::getTotalAmount)
                    .filter(a -> a != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            kpi.setCurrentValue(revenue);
            log.info("Revenue for KPI {}: {} (from {} paid invoices)",
                    kpiId, revenue, paidInvoices.size());
            return DtoMapper.toKPIResponseDto(kpiRepository.save(kpi));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to compute revenue for KPI {}: {}", kpiId, e.getMessage());
            throw new RuntimeException("Revenue calculation failed: finance-service unavailable", e);
        }
    }

    /**
     * Calculates payment collection rate: PAID / (PAID + UNPAID + OVERDUE) * 100
     */
    @RateLimiter(name = "kpiCalculation", fallbackMethod = "kpiRateLimitFallback")
    public KPIResponseDto calculatePaymentCollectionRate(Long kpiId) {
        KPI kpi = findEntityById(kpiId);
        try {
            List<InvoiceDto> all = financeClient.getAllInvoices();
            long paid = all.stream().filter(i -> "PAID".equalsIgnoreCase(i.getStatus())).count();
            long total = all.stream()
                    .filter(i -> i.getStatus() != null
                            && !"CANCELLED".equalsIgnoreCase(i.getStatus()))
                    .count();

            if (total > 0) {
                BigDecimal rate = BigDecimal.valueOf((double) paid / total * 100)
                        .setScale(2, RoundingMode.HALF_UP);
                kpi.setCurrentValue(rate);
                log.info("Payment collection for KPI {}: {}/{} = {}%", kpiId, paid, total, rate);
            } else {
                log.warn("No invoices returned from finance-service for KPI {}", kpiId);
                throw new RuntimeException("Collection rate calculation skipped: no invoice data available");
            }
            return DtoMapper.toKPIResponseDto(kpiRepository.save(kpi));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to compute collection rate for KPI {}: {}", kpiId, e.getMessage());
            throw new RuntimeException("Collection rate calculation failed: finance-service unavailable", e);
        }
    }

    public void deleteKPI(Long id) {
        kpiRepository.delete(findEntityById(id));
    }

    // ─── Rate Limiter Fallback ────────────────────────────────────────────────────

    public KPIResponseDto kpiRateLimitFallback(Long kpiId, Throwable t) {
        log.warn("[RATE-LIMIT] KPI calculation rate limit exceeded for kpiId={}: {}", kpiId, t.getMessage());
        throw new RuntimeException("Too many KPI calculation requests. Please try again shortly.");
    }

    private KPI findEntityById(Long id) {
        return kpiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KPI", "id", id));
    }
}
