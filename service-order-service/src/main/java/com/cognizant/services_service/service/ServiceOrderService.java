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

import java.math.BigDecimal;
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

    @Transactional(readOnly = true)
    public List<ServiceOrderResponseDto> getOrdersByAssignee(Long userId) {
        log.debug("Fetching service orders assigned to userId={}", userId);
        return repository.findByAssignedToUserId(userId).stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderResponseDto> getUnassignedOpenOrders() {
        log.debug("Fetching unassigned PENDING service orders (queue)");
        return repository.findByAssignedToUserIdIsNullAndStatus(ServiceOrderStatus.PENDING)
                .stream().map(this::enrich).toList();
    }

    // ─── Write Operations ────────────────────────────────────────────────────────

    public ServiceOrderResponseDto createOrder(ServiceOrderRequestDto dto) {
        log.info("Creating service order for guestId={}, reservationId={}, roomId={}",
                dto.getGuestId(), dto.getReservationId(), dto.getRoomId());

        // Assign default non-zero prices based on ServiceType to service orders when created with zero/null price
        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal defaultPrice = switch (dto.getServiceType()) {
                case SPA -> BigDecimal.valueOf(85.00);
                case GYM -> BigDecimal.valueOf(50.00);
                case LAUNDRY -> BigDecimal.valueOf(35.00);
                case ROOM_SERVICE, RESTAURANT, FOOD_AND_BEVERAGES -> BigDecimal.valueOf(65.00);
                case TRANSPORT -> BigDecimal.valueOf(45.00);
                default -> BigDecimal.valueOf(25.00);
            };
            dto.setPrice(defaultPrice);
        }

        GuestDto guest = null;
        RoomDto room = null;

        // 1. Validate guest if provided
        if (dto.getGuestId() != null) {
            guest = fetchGuestOrThrow(dto.getGuestId());
            if (guest.getStatus() != null && !"ACTIVE".equalsIgnoreCase(guest.getStatus())) {
                throw new BadRequestException(
                        "Cannot create service order: guest id=" + guest.getGuestId()
                                + " has status '" + guest.getStatus() + "'.");
            }
        }

        // 2. Validate reservation if provided
        if (dto.getReservationId() != null) {
            ReservationDto reservation = fetchReservationOrThrow(dto.getReservationId());
            if (dto.getGuestId() != null && !reservation.getGuestId().equals(dto.getGuestId())) {
                throw new BadRequestException(
                        "Reservation " + reservation.getResId() + " does not belong to guest "
                                + dto.getGuestId() + " (belongs to guest " + reservation.getGuestId() + ").");
            }
            if (dto.getRoomId() != null && !reservation.getRoomId().equals(dto.getRoomId())) {
                throw new BadRequestException(
                        "Reservation " + reservation.getResId() + " is for room " + reservation.getRoomId()
                                + ", not room " + dto.getRoomId() + ".");
            }
            // A guest must be physically in the hotel to consume services.
            // CONFIRMED bookings haven't checked in yet; CHECKED_OUT / CANCELLED
            // are terminal. Only CHECKED_IN can place service orders.
            if (reservation.getStatus() != null
                    && !"CHECKED_IN".equalsIgnoreCase(reservation.getStatus())) {
                throw new BadRequestException(
                        "Cannot create service order: reservation " + reservation.getResId()
                                + " is in status '" + reservation.getStatus()
                                + "'. Guest must be CHECKED_IN.");
            }
        }

        // 3. Validate room if provided
        if (dto.getRoomId() != null) {
            room = fetchRoomOrThrow(dto.getRoomId());
        }

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

        // Re-validate references when they change (null-safe)
        boolean guestChanged = !java.util.Objects.equals(existing.getGuestId(), dto.getGuestId());
        boolean reservationChanged = !java.util.Objects.equals(existing.getReservationId(), dto.getReservationId());
        boolean roomChanged = !java.util.Objects.equals(existing.getRoomId(), dto.getRoomId());

        GuestDto guest = null;
        RoomDto room = null;

        if (guestChanged && dto.getGuestId() != null) {
            guest = fetchGuestOrThrow(dto.getGuestId());
            if (guest.getStatus() != null && !"ACTIVE".equalsIgnoreCase(guest.getStatus())) {
                throw new BadRequestException(
                        "Cannot update service order: guest id=" + guest.getGuestId()
                                + " has status '" + guest.getStatus() + "'.");
            }
        }
        if ((reservationChanged || guestChanged || roomChanged) && dto.getReservationId() != null) {
            ReservationDto r = fetchReservationOrThrow(dto.getReservationId());
            if (dto.getGuestId() != null && !r.getGuestId().equals(dto.getGuestId())) {
                throw new BadRequestException(
                        "Reservation " + r.getResId() + " does not belong to guest " + dto.getGuestId());
            }
            if (dto.getRoomId() != null && !r.getRoomId().equals(dto.getRoomId())) {
                throw new BadRequestException(
                        "Reservation " + r.getResId() + " is for room " + r.getRoomId()
                                + ", not room " + dto.getRoomId());
            }
        }
        if (roomChanged && dto.getRoomId() != null) {
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

    /**
     * Assigns (or re-assigns) the order to a staff member. Typically called when a
     * service-staff user picks an order from the unassigned queue.
     */
    public ServiceOrderResponseDto assignOrder(Long id, Long userId) {
        log.info("Assigning service order id={} to userId={}", id, userId);
        ServiceOrder existing = findEntityById(id);

        if (existing.getStatus() == ServiceOrderStatus.COMPLETED
                || existing.getStatus() == ServiceOrderStatus.CANCELLED) {
            throw new BadRequestException(
                    "Cannot assign an order in terminal status '" + existing.getStatus() + "'.");
        }
        existing.setAssignedToUserId(userId);
        // Do NOT auto-promote PENDING → CONFIRMED on assignment. The kanban
        // flow is Pending (PENDING) → In Progress (IN_PROGRESS) → Ready
        // (CONFIRMED) → Completed (COMPLETED). Assignment only sets the
        // assignee; the staff member is responsible for advancing the status
        // when they actually start work.
        return enrich(repository.save(existing));
    }

    /**
     * Convenience: assign to the staff member AND move to IN_PROGRESS in one call.
     * Used by the "Accept & Start" button in the service-fulfillment UI.
     *
     * With the kanban flow Pending → In Progress → Ready (CONFIRMED) → Completed,
     * only PENDING orders are eligible for acceptance — CONFIRMED now means
     * "Ready" (work done, awaiting completion) and going back to IN_PROGRESS
     * would be a backwards transition.
     */
    public ServiceOrderResponseDto acceptOrder(Long id, Long userId) {
        log.info("Service-staff userId={} accepting order id={}", userId, id);
        ServiceOrder existing = findEntityById(id);

        if (existing.getStatus() != ServiceOrderStatus.PENDING) {
            throw new BadRequestException(
                    "Only PENDING orders can be accepted; current: " + existing.getStatus());
        }
        existing.setAssignedToUserId(userId);
        validateStatusTransition(existing.getStatus(), ServiceOrderStatus.IN_PROGRESS);
        existing.setStatus(ServiceOrderStatus.IN_PROGRESS);
        return enrich(repository.save(existing));
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

        if (existing.getStatus() == ServiceOrderStatus.CONFIRMED
                || existing.getStatus() == ServiceOrderStatus.IN_PROGRESS
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
     * Validates status transitions to enforce the linear kanban flow:
     * <pre>
     *   PENDING     → IN_PROGRESS | CANCELLED
     *   IN_PROGRESS → CONFIRMED   | CANCELLED
     *   CONFIRMED   → COMPLETED   | CANCELLED
     *   COMPLETED   → (terminal)
     *   CANCELLED   → (terminal)
     * </pre>
     * In UI terms: Pending → In Progress → Ready (CONFIRMED) → Completed.
     * The previous version allowed direct PENDING → CONFIRMED (which let
     * assignment skip In Progress) and CONFIRMED → IN_PROGRESS (a backwards
     * move). Both are now blocked to keep the flow strictly forward.
     */
    private void validateStatusTransition(ServiceOrderStatus current, ServiceOrderStatus next) {
        if (current == next) {
            // idempotent no-op is fine; let it through
            return;
        }
        boolean valid = switch (current) {
            case PENDING     -> next == ServiceOrderStatus.IN_PROGRESS
                                || next == ServiceOrderStatus.CANCELLED;
            case IN_PROGRESS -> next == ServiceOrderStatus.CONFIRMED
                                || next == ServiceOrderStatus.CANCELLED;
            case CONFIRMED   -> next == ServiceOrderStatus.COMPLETED
                                || next == ServiceOrderStatus.CANCELLED;
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
        if (order.getGuestId() != null) {
            try {
                guest = guestReservationClient.getGuestById(order.getGuestId());
            } catch (Exception e) {
                log.warn("Failed to enrich guest id={}: {}", order.getGuestId(), e.getMessage());
            }
        }
        if (order.getRoomId() != null) {
            try {
                room = roomServiceClient.getRoomById(order.getRoomId());
            } catch (Exception e) {
                log.warn("Failed to enrich room id={}: {}", order.getRoomId(), e.getMessage());
            }
        }
        return ServiceOrderMapper.toResponseDto(order, guest, room);
    }
}
