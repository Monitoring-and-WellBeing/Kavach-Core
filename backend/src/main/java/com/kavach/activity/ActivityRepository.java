package com.kavach.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<ActivityLog, UUID> {

    List<ActivityLog> findByDeviceIdAndTimestampBetween(UUID deviceId, Instant start, Instant end);

    @Query("SELECT a.appName, SUM(a.durationMinutes) as total FROM ActivityLog a " +
           "WHERE a.deviceId = :deviceId GROUP BY a.appName ORDER BY total DESC")
    List<Object[]> findTopAppsByDeviceId(UUID deviceId);

    @Query("SELECT a.category, SUM(a.durationMinutes) as total FROM ActivityLog a " +
           "WHERE a.deviceId = :deviceId GROUP BY a.category")
    List<Object[]> findCategoryBreakdownByDeviceId(UUID deviceId);
}
