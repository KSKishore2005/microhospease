package com.cognizant.billing.repository;

import com.cognizant.billing.entity.Invoice;
import com.cognizant.billing.enums.InvoiceStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByGuestId(Long guestId);
    Optional<Invoice> findByReservationId(Long reservationId);
    List<Invoice> findByStatus(InvoiceStatus status);
    boolean existsByReservationId(Long reservationId);

    /**
     * Pessimistic-write lookup used by PaymentService.createPayment to prevent
     * two concurrent payments from both seeing the same "remaining balance" and
     * silently over- or under-paying the invoice. The lock is released when the
     * surrounding transaction commits.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invoice i WHERE i.invoiceId = :id")
    Optional<Invoice> findByIdForUpdate(@Param("id") Long id);
}
