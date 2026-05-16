package com.cognizant.billing.repository;

import com.cognizant.billing.entity.Invoice;
import com.cognizant.billing.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByGuestId(Long guestId);
    Optional<Invoice> findByReservationId(Long reservationId);
    List<Invoice> findByStatus(InvoiceStatus status);
    boolean existsByReservationId(Long reservationId);
}
