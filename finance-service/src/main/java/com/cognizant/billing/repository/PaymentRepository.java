package com.cognizant.billing.repository;

import com.cognizant.billing.entity.Payment;
import com.cognizant.billing.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByInvoice_InvoiceId(Long invoiceId);

    List<Payment> findByGuestId(Long guestId);

    List<Payment> findByStatus(PaymentStatus status);

    /**
     * Sum of SUCCESS payments for an invoice. Used to compute balance and
     * validate strict-match payment amounts.
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.invoice.invoiceId = :invoiceId AND p.status = " +
           "com.cognizant.billing.enums.PaymentStatus.SUCCESS")
    BigDecimal sumSuccessfulPaymentsForInvoice(@Param("invoiceId") Long invoiceId);
}
