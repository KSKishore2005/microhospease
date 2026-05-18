package com.cognizant.hospease.service;

import com.cognizant.hospease.client.FinanceClient;
import com.cognizant.hospease.client.RoomServiceClient;
import com.cognizant.hospease.client.ServiceOrderClient;
import com.cognizant.hospease.client.UserServiceClient;
import com.cognizant.hospease.client.dto.InvoiceDto;
import com.cognizant.hospease.client.dto.RoomDto;
import com.cognizant.hospease.client.dto.ServiceOrderDto;
import com.cognizant.hospease.client.dto.UserDto;
import com.cognizant.hospease.enums.ReportScope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Auto-generates a human-readable contentSummary for a Report
 * based on its scope by fetching live data from upstream services.
 *
 * Called by ReportService when contentSummary is null or blank.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportContentGeneratorService {

    private final RoomServiceClient    roomServiceClient;
    private final FinanceClient        financeClient;
    private final ServiceOrderClient   serviceOrderClient;
    private final UserServiceClient    userServiceClient;

    /**
     * Returns an auto-generated content summary for the given scope.
     * If the upstream service is unavailable, returns a fallback message.
     */
    public String generate(ReportScope scope) {
        if (scope == null) return generateGeneral();
        return switch (scope) {
            case OCCUPANCY    -> generateOccupancy();
            case FINANCE      -> generateFinance();
            case HOUSEKEEPING -> generateHousekeeping();
            case SERVICES     -> generateServices();
            case STAFF        -> generateStaff();
            case GENERAL      -> generateGeneral();
        };
    }

    // ─── OCCUPANCY ────────────────────────────────────────────────────────────────

    private String generateOccupancy() {
        try {
            List<RoomDto> rooms = roomServiceClient.getAllRooms();
            long total       = rooms.size();
            long occupied    = rooms.stream().filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus())).count();
            long available   = rooms.stream().filter(r -> "AVAILABLE".equalsIgnoreCase(r.getStatus())).count();
            long maintenance = rooms.stream().filter(r -> "MAINTENANCE".equalsIgnoreCase(r.getStatus())).count();

            double rate = total > 0
                    ? BigDecimal.valueOf((double) occupied / total * 100)
                               .setScale(2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            StringBuilder sb = new StringBuilder();
            sb.append("Room Occupancy Summary\n");
            sb.append("----------------------\n");
            sb.append(line("Total Rooms",          String.valueOf(total)));
            sb.append(line("Occupied Rooms",        String.valueOf(occupied)));
            sb.append(line("Available Rooms",       String.valueOf(available)));
            sb.append(line("Under Maintenance",     String.valueOf(maintenance)));
            sb.append(line("Occupancy Rate",        rate + "%"));

            if (maintenance > 0) {
                sb.append("\nRooms Under Maintenance:\n");
                rooms.stream()
                     .filter(r -> "MAINTENANCE".equalsIgnoreCase(r.getStatus()))
                     .forEach(r -> sb.append("  - Room ").append(r.getNumber())
                                     .append(" (").append(r.getType()).append(")\n"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Auto-generate OCCUPANCY failed: {}", e.getMessage());
            return "Room occupancy data could not be retrieved automatically. " +
                   "Please enter the content summary manually.";
        }
    }

    // ─── FINANCE ─────────────────────────────────────────────────────────────────

    private String generateFinance() {
        try {
            List<InvoiceDto> all = financeClient.getAllInvoices();

            long paid     = all.stream().filter(i -> "PAID".equalsIgnoreCase(i.getStatus())).count();
            long unpaid   = all.stream().filter(i -> "UNPAID".equalsIgnoreCase(i.getStatus())).count();
            long overdue  = all.stream().filter(i -> "OVERDUE".equalsIgnoreCase(i.getStatus())).count();
            long cancelled= all.stream().filter(i -> "CANCELLED".equalsIgnoreCase(i.getStatus())).count();
            long total    = all.size();
            long active   = total - cancelled;

            BigDecimal revenue = all.stream()
                    .filter(i -> "PAID".equalsIgnoreCase(i.getStatus()))
                    .map(InvoiceDto::getTotalAmount)
                    .filter(a -> a != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal outstanding = all.stream()
                    .filter(i -> "UNPAID".equalsIgnoreCase(i.getStatus())
                              || "OVERDUE".equalsIgnoreCase(i.getStatus()))
                    .map(InvoiceDto::getBalanceDue)
                    .filter(a -> a != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            double collectionRate = active > 0
                    ? BigDecimal.valueOf((double) paid / active * 100)
                               .setScale(2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            StringBuilder sb = new StringBuilder();
            sb.append("Finance Summary\n");
            sb.append("---------------\n");
            sb.append(line("Total Invoices",         String.valueOf(total)));
            sb.append(line("Paid Invoices",           String.valueOf(paid)));
            sb.append(line("Unpaid Invoices",         String.valueOf(unpaid)));
            sb.append(line("Overdue Invoices",        String.valueOf(overdue)));
            sb.append(line("Cancelled Invoices",      String.valueOf(cancelled)));
            sb.append(line("Total Revenue Collected", "$" + revenue));
            sb.append(line("Outstanding Balance",     "$" + outstanding));
            sb.append(line("Collection Rate",         collectionRate + "%"));
            return sb.toString();
        } catch (Exception e) {
            log.warn("Auto-generate FINANCE failed: {}", e.getMessage());
            return "Finance data could not be retrieved automatically. " +
                   "Please enter the content summary manually.";
        }
    }

    // ─── HOUSEKEEPING ─────────────────────────────────────────────────────────────

    private String generateHousekeeping() {
        try {
            List<RoomDto> rooms = roomServiceClient.getAllRooms();
            long total       = rooms.size();
            long maintenance = rooms.stream().filter(r -> "MAINTENANCE".equalsIgnoreCase(r.getStatus())).count();
            long available   = rooms.stream().filter(r -> "AVAILABLE".equalsIgnoreCase(r.getStatus())).count();
            long occupied    = rooms.stream().filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus())).count();

            StringBuilder sb = new StringBuilder();
            sb.append("Housekeeping Operations Summary\n");
            sb.append("--------------------------------\n");
            sb.append(line("Total Rooms",          String.valueOf(total)));
            sb.append(line("Rooms Available",       String.valueOf(available)));
            sb.append(line("Rooms Occupied",        String.valueOf(occupied)));
            sb.append(line("Rooms Under Maintenance", String.valueOf(maintenance)));

            List<RoomDto> maintenanceRooms = rooms.stream()
                    .filter(r -> "MAINTENANCE".equalsIgnoreCase(r.getStatus()))
                    .collect(Collectors.toList());

            if (!maintenanceRooms.isEmpty()) {
                sb.append("\nMaintenance Rooms Detail:\n");
                maintenanceRooms.forEach(r ->
                        sb.append("  - Room ").append(r.getNumber())
                          .append(" | Type: ").append(r.getType())
                          .append(" | Capacity: ").append(r.getCapacity()).append("\n"));
            } else {
                sb.append(line("Maintenance Status", "All rooms operational"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Auto-generate HOUSEKEEPING failed: {}", e.getMessage());
            return "Housekeeping data could not be retrieved automatically. " +
                   "Please enter the content summary manually.";
        }
    }

    // ─── SERVICES ─────────────────────────────────────────────────────────────────

    private String generateServices() {
        try {
            List<ServiceOrderDto> orders = serviceOrderClient.getAllServiceOrders();
            long total     = orders.size();
            long completed = orders.stream().filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus())).count();
            long pending   = orders.stream().filter(o -> "PENDING".equalsIgnoreCase(o.getStatus())).count();
            long cancelled = orders.stream().filter(o -> "CANCELLED".equalsIgnoreCase(o.getStatus())).count();

            BigDecimal totalRevenue = orders.stream()
                    .filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus()))
                    .map(ServiceOrderDto::getPrice)
                    .filter(p -> p != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            // Group by service type
            Map<String, Long> byType = orders.stream()
                    .filter(o -> o.getServiceType() != null)
                    .collect(Collectors.groupingBy(
                            o -> o.getServiceType(),
                            Collectors.counting()
                    ));

            StringBuilder sb = new StringBuilder();
            sb.append("Service Orders Summary\n");
            sb.append("----------------------\n");
            sb.append(line("Total Orders",     String.valueOf(total)));
            sb.append(line("Completed Orders", String.valueOf(completed)));
            sb.append(line("Pending Orders",   String.valueOf(pending)));
            sb.append(line("Cancelled Orders", String.valueOf(cancelled)));
            sb.append(line("Total Revenue",    "$" + totalRevenue));

            if (!byType.isEmpty()) {
                sb.append("\nBreakdown by Service Type:\n");
                byType.forEach((type, count) ->
                        sb.append("  - ").append(type).append(": ").append(count).append(" orders\n"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Auto-generate SERVICES failed: {}", e.getMessage());
            return "Service order data could not be retrieved automatically. " +
                   "Please enter the content summary manually.";
        }
    }

    // ─── STAFF ───────────────────────────────────────────────────────────────────

    private String generateStaff() {
        try {
            List<UserDto> users = userServiceClient.getAllUsers();
            long total    = users.size();
            long active   = users.stream().filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus())).count();
            long inactive = users.stream().filter(u -> "INACTIVE".equalsIgnoreCase(u.getStatus())).count();

            // Group by role
            Map<String, Long> byRole = users.stream()
                    .filter(u -> u.getRole() != null)
                    .collect(Collectors.groupingBy(u -> u.getRole().toString(), Collectors.counting()));

            StringBuilder sb = new StringBuilder();
            sb.append("Staff Activity Summary\n");
            sb.append("----------------------\n");
            sb.append(line("Total Staff",    String.valueOf(total)));
            sb.append(line("Active Staff",   String.valueOf(active)));
            sb.append(line("Inactive Staff", String.valueOf(inactive)));

            if (!byRole.isEmpty()) {
                sb.append("\nStaff by Role:\n");
                byRole.forEach((role, count) ->
                        sb.append("  - ").append(role).append(": ").append(count).append(" staff\n"));
            }

            sb.append("\nStaff List:\n");
            users.forEach(u ->
                    sb.append("  - ").append(u.getName())
                      .append(" | Role: ").append(u.getRole())
                      .append(" | Status: ").append(u.getStatus())
                      .append(" | Email: ").append(u.getEmail()).append("\n"));

            return sb.toString();
        } catch (Exception e) {
            log.warn("Auto-generate STAFF failed: {}", e.getMessage());
            return "Staff data could not be retrieved automatically. " +
                   "Please enter the content summary manually.";
        }
    }

    // ─── GENERAL ─────────────────────────────────────────────────────────────────

    private String generateGeneral() {
        StringBuilder sb = new StringBuilder();
        sb.append("General Operations Summary\n");
        sb.append("--------------------------\n");

        // Rooms
        try {
            List<RoomDto> rooms = roomServiceClient.getAllRooms();
            long total    = rooms.size();
            long occupied = rooms.stream().filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus())).count();
            double rate   = total > 0 ? Math.round((double) occupied / total * 10000.0) / 100.0 : 0.0;
            sb.append(line("Rooms",          total + " total, " + occupied + " occupied (" + rate + "%)"));
        } catch (Exception e) {
            sb.append(line("Rooms", "Unavailable"));
            log.warn("General report - room-service unavailable: {}", e.getMessage());
        }

        // Finance
        try {
            List<InvoiceDto> invoices = financeClient.getAllInvoices();
            BigDecimal revenue = invoices.stream()
                    .filter(i -> "PAID".equalsIgnoreCase(i.getStatus()))
                    .map(InvoiceDto::getTotalAmount)
                    .filter(a -> a != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            long paid  = invoices.stream().filter(i -> "PAID".equalsIgnoreCase(i.getStatus())).count();
            long total = invoices.stream().filter(i -> !"CANCELLED".equalsIgnoreCase(i.getStatus())).count();
            double rate = total > 0 ? Math.round((double) paid / total * 10000.0) / 100.0 : 0.0;
            sb.append(line("Finance",        "$" + revenue + " revenue, " + rate + "% collection rate"));
        } catch (Exception e) {
            sb.append(line("Finance", "Unavailable"));
            log.warn("General report - finance-service unavailable: {}", e.getMessage());
        }

        // Service Orders
        try {
            List<ServiceOrderDto> orders = serviceOrderClient.getAllServiceOrders();
            long total     = orders.size();
            long completed = orders.stream().filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus())).count();
            sb.append(line("Service Orders", total + " total, " + completed + " completed"));
        } catch (Exception e) {
            sb.append(line("Service Orders", "Unavailable"));
            log.warn("General report - service-order-service unavailable: {}", e.getMessage());
        }

        return sb.toString();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────────

    private String line(String label, String value) {
        return String.format("%-30s:  %s%n", label, value);
    }
}
