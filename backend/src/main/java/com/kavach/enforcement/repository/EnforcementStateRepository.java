package com.kavach.enforcement.repository;

import com.kavach.enforcement.entity.EnforcementState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface EnforcementStateRepository extends JpaRepository<EnforcementState, UUID> {

    /**
     * Get the current rules version for a device.
     * Returns 0 if no state row exists yet (device has never synced).
     */
    @Query("""
        SELECT COALESCE(s.rulesVersion, 0) FROM EnforcementState s
        WHERE s.deviceId = :deviceId
        """)
    Integer getVersion(@Param("deviceId") UUID deviceId);

    /**
     * Atomically increment the rules_version counter.
     * Called by BlockingService and FocusService whenever a rule changes
     * so that both clients detect the change on their next 30-second poll.
     *
     * Uses an UPSERT: if no row exists for the device yet, one is created.
     */
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO enforcement_state (device_id, rules_version)
        VALUES (:deviceId, 1)
        ON CONFLICT (device_id)
        DO UPDATE SET rules_version = enforcement_state.rules_version + 1
        """, nativeQuery = true)
    void incrementVersion(@Param("deviceId") UUID deviceId);

    /**
     * Increment version for ALL active devices in a tenant.
     * Used when a rule change applies to ALL_DEVICES (no specific deviceId).
     */
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO enforcement_state (device_id, rules_version)
        SELECT d.id, 1 FROM devices d
        WHERE d.tenant_id = :tenantId AND d.is_active = true
        ON CONFLICT (device_id)
        DO UPDATE SET rules_version = enforcement_state.rules_version + 1
        """, nativeQuery = true)
    void incrementVersionForTenant(@Param("tenantId") UUID tenantId);
}
