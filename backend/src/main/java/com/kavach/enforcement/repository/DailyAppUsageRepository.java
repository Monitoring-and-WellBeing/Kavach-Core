package com.kavach.enforcement.repository;

import com.kavach.enforcement.entity.DailyAppUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface DailyAppUsageRepository extends JpaRepository<DailyAppUsage, UUID> {
    interface UsageSummary {
        String getCategory();
        String getPackageName();
        Long getTotalDuration();
    }

    /**
     * Find today's usage row for a specific device + category + optional package.
     * Used by TimeLimitService to accumulate incremental usage reports.
     */
    @Query("""
        SELECT u FROM DailyAppUsage u
        WHERE u.deviceId = :deviceId
          AND u.usageDate = :date
          AND u.appCategory = :category
          AND (:packageName IS NULL AND u.packageName IS NULL
               OR u.packageName = :packageName)
        """)
    Optional<DailyAppUsage> findByDeviceIdAndDateAndCategoryAndPackage(
        @Param("deviceId")    UUID deviceId,
        @Param("date")        LocalDate date,
        @Param("category")    String category,
        @Param("packageName") String packageName
    );

    /**
     * Returns total seconds used today for a device + category + optional package.
     * Returns 0 if no row exists yet.
     */
    @Query("""
        SELECT COALESCE(SUM(u.durationSeconds), 0)
        FROM DailyAppUsage u
        WHERE u.deviceId = :deviceId
          AND u.usageDate = CURRENT_DATE
          AND u.appCategory = :category
          AND (:packageName IS NULL AND u.packageName IS NULL
               OR u.packageName = :packageName)
        """)
    int getTodayUsage(
        @Param("deviceId")    UUID deviceId,
        @Param("category")    String category,
        @Param("packageName") String packageName
    );

    @Modifying
    @Query(value = """
        INSERT INTO daily_app_usage (device_id, tenant_id, usage_date, app_category, package_name, duration_seconds, last_updated)
        VALUES (:deviceId, :tenantId, CURRENT_DATE, :category, :packageName, :durationSeconds, NOW())
        ON CONFLICT (device_id, usage_date, app_category, package_name)
        DO UPDATE SET duration_seconds = daily_app_usage.duration_seconds + EXCLUDED.duration_seconds,
                      last_updated = NOW()
        """, nativeQuery = true)
    void upsertUsage(
        @Param("deviceId") UUID deviceId,
        @Param("tenantId") UUID tenantId,
        @Param("category") String category,
        @Param("packageName") String packageName,
        @Param("durationSeconds") int durationSeconds
    );

    @Query(value = """
        SELECT app_category AS category, package_name AS packageName, SUM(duration_seconds) AS totalDuration
        FROM daily_app_usage
        WHERE device_id = :deviceId AND usage_date = CURRENT_DATE
        GROUP BY app_category, package_name
        """, nativeQuery = true)
    java.util.List<UsageSummary> getBatchUsageForDevice(@Param("deviceId") UUID deviceId);
    // GAP-9 FIXED
    // GAP-12 FIXED
}
