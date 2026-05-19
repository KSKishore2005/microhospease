package com.cognizant.hospease.client.fallback;

import com.cognizant.hospease.client.FinanceClient;
import com.cognizant.hospease.client.dto.InvoiceDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Fallback for FinanceClient.
 * Returns empty lists when finance-service is unreachable or circuit is open.
 */
@Slf4j
@Component
public class FinanceClientFallback implements FinanceClient {

    @Override
    public List<InvoiceDto> getAllInvoices() {
        log.warn("[FALLBACK] finance-service unavailable — returning empty invoice list");
        return Collections.emptyList();
    }

    @Override
    public List<InvoiceDto> getInvoicesByStatus(String status) {
        log.warn("[FALLBACK] finance-service unavailable — returning empty invoice list for status: {}", status);
        return Collections.emptyList();
    }
}
