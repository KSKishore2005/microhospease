package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.InvoiceDto;
import com.cognizant.hospease.client.fallback.FinanceClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Calls finance-service for invoice/revenue data.
 * Falls back to FinanceClientFallback when the circuit is open or the service is unreachable.
 */
@FeignClient(
        name = "finance-service",
        url = "${finance-service.url:}",
        fallback = FinanceClientFallback.class
)
public interface FinanceClient {

    @GetMapping("/api/invoices")
    List<InvoiceDto> getAllInvoices();

    @GetMapping("/api/invoices/status/{status}")
    List<InvoiceDto> getInvoicesByStatus(@PathVariable("status") String status);
}
