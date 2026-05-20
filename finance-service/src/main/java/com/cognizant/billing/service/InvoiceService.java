package com.cognizant.billing.service;

import com.cognizant.billing.client.GuestReservationClient;
import com.cognizant.billing.client.ServiceOrderClient;
import com.cognizant.billing.client.dto.GuestDto;
import com.cognizant.billing.client.dto.ReservationDto;
import com.cognizant.billing.client.dto.ServiceOrderDto;
import com.cognizant.billing.common.exception.BadRequestException;
import com.cognizant.billing.common.exception.ConflictException;
import com.cognizant.billing.common.exception.ResourceNotFoundException;
import com.cognizant.billing.dto.DtoMapper;
import com.cognizant.billing.dto.InvoiceRequestDto;
import com.cognizant.billing.dto.InvoiceResponseDto;
import com.cognizant.billing.entity.Invoice;
import com.cognizant.billing.enums.InvoiceStatus;
import com.cognizant.billing.repository.InvoiceRepository;
import com.cognizant.billing.repository.PaymentRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    /**
     * Only service orders the guest has actually committed to and that the hotel
     * has actually delivered (or is mid-delivery) get billed. PENDING orders are
     * unconfirmed requests that may yet be cancelled — billing them would let
     * guests be charged for things that never happened.
     */
    private static final Set<String> CHARGEABLE_ORDER_STATUSES =
            Set.of("CONFIRMED", "IN_PROGRESS", "COMPLETED");

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final GuestReservationClient guestReservationClient;
    private final ServiceOrderClient serviceOrderClient;

    // ─── Read ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InvoiceResponseDto> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::enrich)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponseDto getInvoiceById(Long id) {
        return enrich(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponseDto> getInvoicesByGuest(Long guestId) {
        return invoiceRepository.findByGuestId(guestId).stream()
                .map(this::enrich).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponseDto getInvoiceByReservation(Long reservationId) {
        Invoice invoice = invoiceRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice", "reservationId", reservationId));
        return enrich(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponseDto> getInvoicesByStatus(InvoiceStatus status) {
        return invoiceRepository.findByStatus(status).stream()
                .map(this::enrich).collect(Collectors.toList());
    }

    // ─── Manual create / update ──────────────────────────────────────────────────

    public InvoiceResponseDto createInvoice(InvoiceRequestDto dto) {
        log.info("Creating invoice manually for guestId={}, reservationId={}",
                dto.getGuestId(), dto.getReservationId());

        // Validate guest
        fetchGuestOrThrow(dto.getGuestId());

        // If reservation provided, validate it and enforce uniqueness
        if (dto.getReservationId() != null) {
            ReservationDto reservation = fetchReservationOrThrow(dto.getReservationId());
            if (!reservation.getGuestId().equals(dto.getGuestId())) {
                throw new BadRequestException(
                        "Reservation " + reservation.getResId()
                                + " does not belong to guest " + dto.getGuestId());
            }
            if (invoiceRepository.existsByReservationId(dto.getReservationId())) {
                throw new ConflictException(
                        "Invoice already exists for reservation " + dto.getReservationId());
            }
        }

        Invoice saved = invoiceRepository.save(DtoMapper.toInvoice(dto));
        log.info("Invoice created id={}", saved.getInvoiceId());
        return enrich(saved);
    }

    public InvoiceResponseDto updateInvoice(Long id, InvoiceRequestDto dto) {
        log.info("Updating invoice id={}", id);
        Invoice existing = findEntityById(id);

        if (existing.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Cannot update a PAID invoice");
        }
        if (existing.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Cannot update a CANCELLED invoice");
        }

        existing.setLineItemsJson(dto.getLineItemsJson());
        existing.setTotalAmount(dto.getTotalAmount());
        existing.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "USD");
        existing.setDueDate(dto.getDueDate());
        existing.setInvoiceUri(dto.getInvoiceUri());
        return enrich(invoiceRepository.save(existing));
    }

    // ─── Auto-invoice generation from reservation + service orders ───────────────

    /**
     * Generates an invoice for a reservation:
     * 1. Fetches the reservation (room rate, dates)
     * 2. Fetches all chargeable service orders for the reservation
     * 3. Computes total = (nights * ratePerNight) + sum(service prices)
     * 4. Creates the invoice with detailed lineItemsJson
     */
    public InvoiceResponseDto generateInvoiceForReservation(Long reservationId) {
        log.info("Auto-generating invoice for reservationId={}", reservationId);

        // Enforce uniqueness early
        if (invoiceRepository.existsByReservationId(reservationId)) {
            throw new ConflictException(
                    "Invoice already exists for reservation " + reservationId);
        }

        // 1. Reservation
        ReservationDto reservation = fetchReservationOrThrow(reservationId);
        if (reservation.getStatus() != null
                && reservation.getStatus().equalsIgnoreCase("CANCELLED")) {
            throw new BadRequestException(
                    "Cannot generate invoice for a CANCELLED reservation");
        }
        if (reservation.getCheckInDate() == null || reservation.getCheckOutDate() == null) {
            throw new BadRequestException("Reservation is missing check-in/check-out dates");
        }
        if (!reservation.getCheckOutDate().isAfter(reservation.getCheckInDate())) {
            throw new BadRequestException("Reservation check-out must be after check-in");
        }

        // Resolve room rate
        BigDecimal ratePerNight = resolveRatePerNight(reservation);
        if (ratePerNight == null || ratePerNight.signum() <= 0) {
            throw new BadRequestException("Could not determine a valid room rate for reservation "
                    + reservationId);
        }

        long nights = ChronoUnit.DAYS.between(reservation.getCheckInDate(),
                reservation.getCheckOutDate());
        BigDecimal roomCharge = ratePerNight.multiply(BigDecimal.valueOf(nights));

        // 2. Service orders
        List<ServiceOrderDto> orders;
        try {
            orders = serviceOrderClient.getOrdersByReservationId(reservationId);
            if (orders == null) orders = List.of();
        } catch (Exception e) {
            log.warn("service-order-service unavailable; proceeding with room charges only: {}",
                    e.getMessage());
            orders = List.of();
        }

        BigDecimal serviceCharges = orders.stream()
                .filter(o -> o.getStatus() == null
                        || CHARGEABLE_ORDER_STATUSES.contains(o.getStatus().toUpperCase()))
                .map(ServiceOrderDto::getPrice)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = roomCharge.add(serviceCharges);

        // 3. Build line items JSON (simple hand-rolled to avoid pulling in extra deps)
        String lineItemsJson = buildLineItemsJson(reservation, nights, ratePerNight,
                roomCharge, orders, serviceCharges, total);

        // 4. Persist
        Invoice invoice = Invoice.builder()
                .guestId(reservation.getGuestId())
                .reservationId(reservationId)
                .lineItemsJson(lineItemsJson)
                .totalAmount(total)
                .currency("USD")
                .dueDate(LocalDate.now().plusDays(7))
                .status(InvoiceStatus.UNPAID)
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Auto-invoice created id={} total={}", saved.getInvoiceId(), total);
        return enrich(saved);
    }

    // ─── Status transitions ──────────────────────────────────────────────────────

    public InvoiceResponseDto markAsPaid(Long id) {
        Invoice invoice = findEntityById(id);
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Cannot mark a CANCELLED invoice as PAID");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            return enrich(invoice); // idempotent
        }

        // A manual "mark paid" is only valid when the ledger actually has
        // successful payments covering the invoice total. Otherwise the books
        // and the cashbox disagree.
        BigDecimal collected = paymentRepository.sumSuccessfulPaymentsForInvoice(id);
        if (collected == null) collected = BigDecimal.ZERO;
        if (collected.compareTo(invoice.getTotalAmount()) < 0) {
            throw new BadRequestException(
                    "Cannot mark invoice as PAID — payments collected (" + collected
                            + ") do not cover the total amount (" + invoice.getTotalAmount() + ").");
        }

        invoice.setStatus(InvoiceStatus.PAID);
        return enrich(invoiceRepository.save(invoice));
    }

    public InvoiceResponseDto markAsOverdue(Long id) {
        Invoice invoice = findEntityById(id);
        // PAID or CANCELLED invoices can't go OVERDUE; OVERDUE itself is idempotent.
        if (invoice.getStatus() == InvoiceStatus.PAID
                || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException(
                    "Cannot mark a " + invoice.getStatus() + " invoice as OVERDUE.");
        }
        invoice.setStatus(InvoiceStatus.OVERDUE);
        return enrich(invoiceRepository.save(invoice));
    }

    public InvoiceResponseDto cancelInvoice(Long id) {
        Invoice invoice = findEntityById(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Cannot cancel a PAID invoice");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            return enrich(invoice); // idempotent
        }

        // Refuse to cancel if there are successful, unrefunded payments
        BigDecimal unrefunded = paymentRepository.sumSuccessfulPaymentsForInvoice(id);
        if (unrefunded != null && unrefunded.signum() > 0) {
            throw new BadRequestException(
                    "Cannot cancel invoice with unrefunded payments totalling "
                            + unrefunded + ". Refund them first.");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        return enrich(invoiceRepository.save(invoice));
    }

    public void deleteInvoice(Long id) {
        Invoice invoice = findEntityById(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Cannot delete a PAID invoice; cancel it first");
        }
        invoiceRepository.delete(invoice);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    public Invoice findEntityById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
    }

    private BigDecimal resolveRatePerNight(ReservationDto reservation) {
        if (reservation.getRatePerNight() != null) return reservation.getRatePerNight();
        if (reservation.getRoom() != null && reservation.getRoom().getRatePerNight() != null) {
            return reservation.getRoom().getRatePerNight();
        }
        return null;
    }

    private GuestDto fetchGuestOrThrow(Long guestId) {
        try {
            GuestDto g = guestReservationClient.getGuestById(guestId);
            if (g == null) throw new ResourceNotFoundException("Guest", "id", guestId);
            return g;
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Guest", "id", guestId);
        }
    }

    private ReservationDto fetchReservationOrThrow(Long reservationId) {
        try {
            ReservationDto r = guestReservationClient.getReservationById(reservationId);
            if (r == null) throw new ResourceNotFoundException("Reservation", "id", reservationId);
            return r;
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Reservation", "id", reservationId);
        }
    }

    /**
     * Builds invoice response with paid amount + enriched guest data.
     * Falls back gracefully when upstream services aren't reachable.
     */
    InvoiceResponseDto enrich(Invoice invoice) {
        BigDecimal paid = paymentRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
        GuestDto guest = null;
        try {
            guest = guestReservationClient.getGuestById(invoice.getGuestId());
        } catch (Exception e) {
            log.warn("Failed to enrich guest id={}: {}", invoice.getGuestId(), e.getMessage());
        }
        return DtoMapper.toInvoiceResponseDto(invoice, guest, paid);
    }

    /** Simple hand-rolled JSON builder. Keeps dependencies minimal. */
    private String buildLineItemsJson(ReservationDto reservation, long nights,
                                      BigDecimal ratePerNight, BigDecimal roomCharge,
                                      List<ServiceOrderDto> orders,
                                      BigDecimal serviceCharges, BigDecimal total) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"roomCharge\":{");
        sb.append("\"reservationId\":").append(reservation.getResId()).append(",");
        sb.append("\"roomId\":").append(reservation.getRoomId()).append(",");
        sb.append("\"checkIn\":\"").append(reservation.getCheckInDate()).append("\",");
        sb.append("\"checkOut\":\"").append(reservation.getCheckOutDate()).append("\",");
        sb.append("\"nights\":").append(nights).append(",");
        sb.append("\"ratePerNight\":").append(ratePerNight).append(",");
        sb.append("\"subtotal\":").append(roomCharge);
        sb.append("},");
        sb.append("\"serviceOrders\":[");
        for (int i = 0; i < orders.size(); i++) {
            ServiceOrderDto o = orders.get(i);
            if (i > 0) sb.append(",");
            sb.append("{");
            sb.append("\"orderId\":").append(o.getOrderId()).append(",");
            sb.append("\"serviceType\":\"").append(safe(o.getServiceType())).append("\",");
            sb.append("\"description\":\"").append(safe(o.getDescription())).append("\",");
            sb.append("\"price\":").append(o.getPrice() != null ? o.getPrice() : BigDecimal.ZERO);
            sb.append("}");
        }
        sb.append("],");
        sb.append("\"serviceChargesTotal\":").append(serviceCharges).append(",");
        sb.append("\"grandTotal\":").append(total);
        sb.append("}");
        return sb.toString();
    }

    private String safe(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
