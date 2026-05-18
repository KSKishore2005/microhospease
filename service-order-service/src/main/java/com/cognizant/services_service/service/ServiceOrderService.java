package com.cognizant.services_service.service;

import com.cognizant.services_service.client.GuestReservationClient;
import com.cognizant.services_service.client.RoomServiceClient;
import com.cognizant.services_service.client.dto.GuestDto;
import com.cognizant.services_service.client.dto.ReservationDto;
import com.cognizant.services_service.client.dto.RoomDto;
import com.cognizant.services_service.common.exception.BadRequestException;
import com.cognizant.services_service.common.exception.ResourceNotFoundException;
import com.cognizant.services_service.dto.ServiceOrderRequestDto;
import com.cognizant.services_service.dto.ServiceOrderResponseDto;
import com.cognizant.services_service.mapper.ServiceOrderMapper;
import com.cognizant.services_service.model.ServiceOrder;
import com.cognizant.services_service.model.ServiceOrderStatus;
import com.cognizant.services_service.model.ServiceType;
import com.cognizant.services_service.repository.ServiceOrderRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ServiceOrderService {

    private final ServiceOrderRepository repository;
    private final GuestReservationClient guestReservationClient;
    private final RoomServiceClient roomServiceClient;

    // ─── Read Operations ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ServiceOrderResponseDto> getAllOrders() {
        log.debug("Fetching all service orders");
        return repository.findAll().stream()
                .map(this::enrich)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceOrderResponseDto getOrderById(Long id) {
        log.debug("Fetching service order id={}", id);
        return enrich(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderResponseDto> getOrdersByGuestId(Long guestId) {
        log.debug("Fetching service orders for guestId={}", guestId);
        return repository.findByGuestId(guestId).stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderResponseDto> getOrdersByReservationId(Long reservationId) {
        log.debug("Fetching service orders for reservationId={}", reservationId);
        return repository.findByReservationId(reservationId).stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderResponseDto> getOrdersByType(ServiceType type) {
        log.debug("Fetching service orders by type={}", type);
        return repository.findByServiceType(type).stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderResponseDto> getOrdersByStatus(ServiceOrderStatus status) {
        log.debug("Fetching service orders by status={}", status);
        return repository.findByStatus(status).stream().map(this::enrich).toList();
    }

    // ─── Write Operations ────────────────────────────────────────────────────────

    public ServiceOrderResponseDto createOrder(ServiceOrderRequestDto dto) {
        log.info("Creating service order for guestId={}, reservationId={}, roomId={}",
                dto.getGuestId(), dto.getReservationId(), dto.getRoomId());

        // 1. Validate guest exists and is ACTIVE
        GuestDto guest = fetchGuestOrThrow(dto.getGuestId());
        if (guest.getStatus() != null && !"ACTIVE".equalsIgnoreCase(guest.getStatus())) {
            throw new BadRequestException(
                    "Cannot create service order: guest id=" + guest.getGuestId()
                            + " has status '" + guest.getStatus() + "'.");
        }

        // 2. Validate reservation exists and matches guest+room
        ReservationDto reservation = fetchReservationOrThrow(dto.getReservationId());
        if (!reservation.getGuestId().equals(dto.getGuestId())) {
            throw new BadRequestException(
                    "Reservation " + reservation.getResId() + " does not belong to guest "
                            + dto.getGuestId() + " (belongs to guest " + reservation.getGuestId() + ").");
        }
        if (!reservation.getRoomId().equals(dto.getRoomId())) {
            throw new BadRequestException(
                    "Reservation " + reservation.getResId() + " is for room " + reservation.getRoomId()
                            + ", not room " + dto.getRoomId() + ".");
        }
        if (reservation.getStatus() != null
                && !Set.of("CONFIRMED", "CHECKED_IN").contains(reservation.getStatus().toUpperCase())) {
            throw new BadRequestException(
                    "Cannot create service order: reservation " + reservation.getResId()
                            + " has status '" + reservation.getStatus() + "'.");
        }

        // 3. Validate room exists
        RoomDto room = fetchRoomOrThrow(dto.getRoomId());

        // 4. Persist
        ServiceOrder saved = repository.save(ServiceOrderMapper.toEntity(dto));
        log.info("Service order created with id={}", saved.getOrderId());

        return ServiceOrderMapper.toResponseDto(saved, guest, room);
    }

    public ServiceOrderResponseDto updateOrder(Long id, ServiceOrderRequestDto dto) {
        log.info("Updating service order id={}", id);

        ServiceOrder existing = findEntityById(id);

        // Forbid edits on terminal states
        if (existing.getStatus() == ServiceOrderStatus.COMPLETED
                || existing.getStatus() == ServiceOrderStatus.CANCELLED) {
            throw new BadRequestException(
                    "Cannot edit a service order in status '" + existing.getStatus() + "'.");
        }

        // Re-validate references when they change
        boolean guestChanged = !existing.getGuestId().equals(dto.getGuestId());
        boolean reservationChanged = !existing.getReservationId().equals(dto.getReservationId());
        boolean roomChanged = !existing.getRoomId().equals(dto.getRoomId());

        GuestDto guest = null;
        RoomDto room = null;

        if (guestChanged) {
            guest = fetchGuestOrThrow(dto.getGuestId());
        }
        if (reservationChanged || guestChanged || roomChanged) {
            ReservationDto r = fetchReservationOrThrow(dto.getReservationId());
            if (!r.getGuestId().equals(dto.getGuestId())) {
                throw new BadRequestException(
                        "Reservation " + r.getResId() + " does not belong to guest " + dto.getGuestId());
            }
            if (!r.getRoomId().equals(dto.getRoomId())) {
                throw new BadRequestException(
                        "Reservation " + r.getResId() + " is for room " + r.getRoomId()
                                + ", not room " + dto.getRoomId());
            }
        }
        if (roomChanged) {
            room = fetchRoomOrThrow(dto.getRoomId());
        }

        existing.setGuestId(dto.getGuestId());
        existing.setReservationId(dto.getReservationId());
        existing.setRoomId(dto.getRoomId());
        existing.setServiceType(dto.getServiceType());
        existing.setDescription(dto.getDescription());
        existing.setPrice(dto.getPrice());

        ServiceOrder saved = repository.save(existing);
        return enrich(saved);
    }

    public ServiceOrderResponseDto updateOrderStatus(Long id, ServiceOrderStatus newStatus) {
        log.info("Updating service order id={} status to {}", id, newStatus);

        ServiceOrder existing = findEntityById(id);
        validateStatusTransition(existing.getStatus(), newStatus);
        existing.setStatus(newStatus);
        ServiceOrder saved = repository.save(existing);

        return enrich(saved);
    }

    public void deleteOrder(Long id) {
        log.info("Deleting service order id={}", id);
        ServiceOrder existing = findEntityById(id);

        if (existing.getStatus() == ServiceOrderStatus.IN_PROGRESS
                || existing.getStatus() == ServiceOrderStatus.COMPLETED) {
            throw new BadRequestException(
                    "Cannot delete a service order in status '" + existing.getStatus()
                            + "'. Cancel it first.");
        }
        repository.delete(existing);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────────

    private ServiceOrder findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceOrder", "id", id));
    }

    /**
     * Validates status transitions to prevent illegal moves like COMPLETED → PENDING.
     * <pre>
     *   PENDING      → IN_PROGRESS | CANCELLED
     *   IN_PROGRESS  → COMPLETED   | CANCELLED
     *   COMPLETED    → (terminal)
     *   CANCELLED    → (terminal)
     * </pre>
     */
    private void validateStatusTransition(ServiceOrderStatus current, ServiceOrderStatus next) {
        if (current == next) {
            // idempotent no-op is fine; let it through
            return;
        }
        boolean valid = switch (current) {
            case PENDING     -> next == ServiceOrderStatus.IN_PROGRESS || next == ServiceOrderStatus.CANCELLED;
            case IN_PROGRESS -> next == ServiceOrderStatus.COMPLETED   || next == ServiceOrderStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new BadRequestException(
                    "Invalid status transition: " + current + " -> " + next);
        }
    }

    private GuestDto fetchGuestOrThrow(Long guestId) {
        try {
            GuestDto guest = guestReservationClient.getGuestById(guestId);
            if (guest == null) {
                throw new ResourceNotFoundException("Guest", "id", guestId);
            }
            return guest;
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Guest", "id", guestId);
        }
        // Other FeignExceptions bubble up to GlobalExceptionHandler → 502/503
    }

    private ReservationDto fetchReservationOrThrow(Long reservationId) {
        try {
            ReservationDto r = guestReservationClient.getReservationById(reservationId);
            if (r == null) {
                throw new ResourceNotFoundException("Reservation", "id", reservationId);
            }
            return r;
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Reservation", "id", reservationId);
        }
    }

    private RoomDto fetchRoomOrThrow(Long roomId) {
        try {
            RoomDto room = roomServiceClient.getRoomById(roomId);
            if (room == null) {
                throw new ResourceNotFoundException("Room", "id", roomId);
            }
            return room;
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Room", "id", roomId);
        }
    }

    /**
     * Enriches a ServiceOrder with guest and room data via Feign.
     * If upstream calls fail, returns the order with null guest/room (graceful degradation).
     */
    private ServiceOrderResponseDto enrich(ServiceOrder order) {
        GuestDto guest = null;
        RoomDto room = null;
        try {
            guest = guestReservationClient.getGuestById(order.getGuestId());
        } catch (Exception e) {
            log.warn("Failed to enrich guest id={}: {}", order.getGuestId(), e.getMessage());
        }
        try {
            room = roomServiceClient.getRoomById(order.getRoomId());
        } catch (Exception e) {
            log.warn("Failed to enrich room id={}: {}", order.getRoomId(), e.getMessage());
        }
        return ServiceOrderMapper.toResponseDto(order, guest, room);
    }
}
