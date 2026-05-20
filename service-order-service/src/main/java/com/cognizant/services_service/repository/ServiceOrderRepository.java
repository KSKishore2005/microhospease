package com.cognizant.services_service.repository;

import com.cognizant.services_service.model.ServiceOrder;
import com.cognizant.services_service.model.ServiceOrderStatus;
import com.cognizant.services_service.model.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {

    List<ServiceOrder> findByGuestId(Long guestId);

    List<ServiceOrder> findByRoomId(Long roomId);

    /**
     * NEW: Used by finance-service via GET /api/service-orders/reservation/{reservationId}
     * to roll up all service charges into an invoice.
     */
    List<ServiceOrder> findByReservationId(Long reservationId);

    List<ServiceOrder> findByServiceType(ServiceType serviceType);

    List<ServiceOrder> findByStatus(ServiceOrderStatus status);

    /** Orders assigned to a specific service-staff user. */
    List<ServiceOrder> findByAssignedToUserId(Long assignedToUserId);

    /** Open orders that are not yet picked up by any staff member (the queue). */
    List<ServiceOrder> findByAssignedToUserIdIsNullAndStatus(ServiceOrderStatus status);
}
