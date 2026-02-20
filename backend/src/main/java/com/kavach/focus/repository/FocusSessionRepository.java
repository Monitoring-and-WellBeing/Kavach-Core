package com.kavach.focus.repository;

import com.kavach.focus.entity.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {

    // Active session for a device — at most one should exist
    Optional<FocusSession> findByDeviceIdAndStatus(UUID deviceId, String status);

    // Session history for a device
    List<FocusSession> findByDeviceIdOrderByStartedAtDesc(UUID deviceId);

    // Session history for a tenant
    List<FocusSession> findByTenantIdOrderByStartedAtDesc(UUID tenantId);

    // Expire sessions whose ends_at has passed
    @Modifying
    @Query("UPDATE FocusSession s SET s.status = 'EXPIRED', s.endReason = 'EXPIRED', " +
           "s.endedAt = :now WHERE s.status = 'ACTIVE' AND s.endsAt < :now")
    int expireElapsedSessions(@Param("now") LocalDateTime now);

    // Count completed sessions for a device today
    @Query("SELECT COUNT(s) FROM FocusSession s WHERE s.deviceId = :deviceId " +
           "AND s.status = 'COMPLETED' AND s.startedAt >= :since")
    long countCompletedSince(@Param("deviceId") UUID deviceId, @Param("since") LocalDateTime since);

    // Total focus minutes completed for a device today
    @Query("SELECT COALESCE(SUM(s.durationMinutes), 0) FROM FocusSession s " +
           "WHERE s.deviceId = :deviceId AND s.status = 'COMPLETED' AND s.startedAt >= :since")
    long totalFocusMinutesSince(@Param("deviceId") UUID deviceId, @Param("since") LocalDateTime since);
}
