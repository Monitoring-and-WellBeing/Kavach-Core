package com.kavach.subscription.repository;

import com.kavach.subscription.entity.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, UUID> {
    Optional<PaymentOrder> findByRazorpayOrderId(String razorpayOrderId);
    Optional<PaymentOrder> findByRazorpayPaymentId(String razorpayPaymentId);

    @Modifying
    @Query(value = """
      UPDATE payment_orders
      SET status = 'PAID', updated_at = NOW()
      WHERE razorpay_payment_id = :razorpayPaymentId AND status = 'CREATED'
      """, nativeQuery = true)
    int markPaidIfCreated(@Param("razorpayPaymentId") String razorpayPaymentId);
}
