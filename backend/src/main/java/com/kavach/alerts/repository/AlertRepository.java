package com.kavach.alerts.repository;

import com.kavach.alerts.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    // Paginated alerts feed for tenant
    Page<Alert> findByTenantIdAndDismissedFalseOrderByTriggeredAtDesc(
        UUID tenantId, Pageable pageable);

    // Unread count
    long countByTenantIdAndReadFalseAndDismissedFalse(UUID tenantId);

    // Mark all as read
    @Modifying
    @Query("UPDATE Alert a SET a.read = true WHERE a.tenantId = :tenantId AND a.read = false")
    void markAllRead(@Param("tenantId") UUID tenantId);

    // Recent alerts for a device
    List<Alert> findTop10ByDeviceIdOrderByTriggeredAtDesc(UUID deviceId);
}
