package com.kavach.enforcement.repository;

import com.kavach.enforcement.entity.DailyAppUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface DailyAppUsageRepository extends JpaRepository<DailyAppUsage, UUID> {

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
}
