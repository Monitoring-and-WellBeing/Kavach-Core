package com.kavach.enforcement.repository;

import com.kavach.enforcement.entity.TimeLimitRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TimeLimitRuleRepository extends JpaRepository<TimeLimitRule, UUID> {

    /**
     * Active time-limit rules that apply to a device — includes both tenant-wide
     * rules (device_id IS NULL) and device-specific rules.
     */
    @Query("""
        SELECT r FROM TimeLimitRule r
        WHERE r.active = true
          AND r.tenantId = :tenantId
          AND (r.deviceId IS NULL OR r.deviceId = :deviceId)
        """)
    List<TimeLimitRule> findActiveRulesForDevice(
        @Param("tenantId") UUID tenantId,
        @Param("deviceId") UUID deviceId
    );

    /**
     * Rules matching a specific device + category/package combination.
     * Used during limit-check to find all applicable rules after usage is recorded.
     */
    @Query("""
        SELECT r FROM TimeLimitRule r
        WHERE r.active = true
          AND r.tenantId = :tenantId
          AND (r.deviceId IS NULL OR r.deviceId = :deviceId)
          AND (r.appCategory = :category OR r.packageName = :packageName)
        """)
    List<TimeLimitRule> findByDeviceAndCategory(
        @Param("tenantId")    UUID tenantId,
        @Param("deviceId")    UUID deviceId,
        @Param("category")    String category,
        @Param("packageName") String packageName
    );
}
