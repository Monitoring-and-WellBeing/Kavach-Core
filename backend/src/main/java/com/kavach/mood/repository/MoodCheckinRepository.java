package com.kavach.mood.repository;

import com.kavach.mood.entity.MoodCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MoodCheckinRepository extends JpaRepository<MoodCheckin, UUID> {

    // Last N mood check-ins for a device, most recent first
    @Query("SELECT m FROM MoodCheckin m WHERE m.deviceId = :deviceId " +
           "ORDER BY m.checkedInAt DESC LIMIT :limit")
    List<MoodCheckin> findRecentByDeviceId(
        @Param("deviceId") UUID deviceId,
        @Param("limit") int limit);

    // Check-ins for a device in the past N days (for parent mood trend widget)
    @Query("SELECT m FROM MoodCheckin m WHERE m.deviceId = :deviceId " +
           "AND m.checkedInAt >= :since ORDER BY m.checkedInAt ASC")
    List<MoodCheckin> findByDeviceIdSince(
        @Param("deviceId") UUID deviceId,
        @Param("since") Instant since);

    // Most recent check-in today (to prevent duplicate submissions)
    @Query("SELECT m FROM MoodCheckin m WHERE m.deviceId = :deviceId " +
           "AND m.checkedInAt >= :startOfDay ORDER BY m.checkedInAt DESC LIMIT 1")
    Optional<MoodCheckin> findTodayCheckin(
        @Param("deviceId") UUID deviceId,
        @Param("startOfDay") Instant startOfDay);

    // All check-ins for parent trend view (7 days, all devices in tenant)
    @Query("SELECT m FROM MoodCheckin m WHERE m.tenantId = :tenantId " +
           "AND m.checkedInAt >= :since ORDER BY m.checkedInAt DESC")
    List<MoodCheckin> findByTenantIdSince(
        @Param("tenantId") UUID tenantId,
        @Param("since") Instant since);
}
