package com.kavach.activity.repository;

import com.kavach.activity.entity.ActivityLog;
import com.kavach.activity.entity.AppCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    // All logs for a device in a time range
    List<ActivityLog> findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
        UUID deviceId, LocalDateTime start, LocalDateTime end);

    // Total screen time for a device today (in seconds)
    @Query("SELECT COALESCE(SUM(a.durationSeconds), 0) FROM ActivityLog a " +
           "WHERE a.deviceId = :deviceId AND a.startedAt >= :since")
    Long totalDurationSince(@Param("deviceId") UUID deviceId, @Param("since") LocalDateTime since);

    // Top apps for a device in a time range
    @Query("SELECT a.appName, a.category, SUM(a.durationSeconds) as totalSecs " +
           "FROM ActivityLog a " +
           "WHERE a.deviceId = :deviceId AND a.startedAt >= :since " +
           "GROUP BY a.appName, a.category " +
           "ORDER BY totalSecs DESC")
    List<Object[]> topAppsSince(@Param("deviceId") UUID deviceId, @Param("since") LocalDateTime since);

    // All logs for a tenant (for institute-wide reports)
    @Query("SELECT a FROM ActivityLog a WHERE a.tenantId = :tenantId " +
           "AND a.startedAt BETWEEN :start AND :end ORDER BY a.startedAt DESC")
    List<ActivityLog> findByTenantAndRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end);

    // Category breakdown for a device
    @Query("SELECT a.category, SUM(a.durationSeconds) FROM ActivityLog a " +
           "WHERE a.deviceId = :deviceId AND a.startedAt >= :since " +
           "GROUP BY a.category")
    List<Object[]> categoryBreakdown(@Param("deviceId") UUID deviceId, @Param("since") LocalDateTime since);

    // Paginated logs for a tenant (all devices)
    @Query("SELECT a FROM ActivityLog a WHERE a.tenantId = :tenantId AND a.startedAt >= :since ORDER BY a.startedAt DESC")
    List<ActivityLog> findRecentByTenantId(
        @Param("tenantId") UUID tenantId,
        @Param("since") LocalDateTime since,
        Pageable pageable);

    // Paginated logs for a specific device within a tenant
    @Query("SELECT a FROM ActivityLog a WHERE a.deviceId = :deviceId AND a.tenantId = :tenantId AND a.startedAt >= :since ORDER BY a.startedAt DESC")
    List<ActivityLog> findRecentByDeviceIdAndTenantId(
        @Param("deviceId") UUID deviceId,
        @Param("tenantId") UUID tenantId,
        @Param("since") LocalDateTime since,
        Pageable pageable);
}
