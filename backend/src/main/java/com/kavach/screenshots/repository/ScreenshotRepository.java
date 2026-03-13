package com.kavach.screenshots.repository;

import com.kavach.screenshots.entity.Screenshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScreenshotRepository extends JpaRepository<Screenshot, UUID> {

    /** All screenshots for a device within a time window, newest first */
    List<Screenshot> findByDeviceIdAndTenantIdAndCapturedAtBetweenOrderByCapturedAtDesc(
            UUID deviceId, UUID tenantId, Instant from, Instant to);

    /** For purge job: screenshots older than cutoff for a tenant */
    List<Screenshot> findByTenantIdAndCapturedAtBefore(UUID tenantId, Instant cutoff);

    /** Count screenshots for a device today (used for quota checks) */
    @Query("SELECT COUNT(s) FROM Screenshot s WHERE s.deviceId = :deviceId AND s.capturedAt >= :from")
    long countByDeviceIdSince(@Param("deviceId") UUID deviceId, @Param("from") Instant from);
}
