package com.kavach.blocking.repository;

import com.kavach.blocking.entity.BlockRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BlockRuleRepository extends JpaRepository<BlockRule, UUID> {

    List<BlockRule> findByTenantIdAndActiveTrue(UUID tenantId);

    List<BlockRule> findByTenantId(UUID tenantId);

    // Rules for a specific device — includes ALL_DEVICES rules + device-specific ones
    @Query("SELECT r FROM BlockRule r WHERE r.active = true AND (" +
           "  (r.tenantId = :tenantId AND r.appliesTo = 'ALL_DEVICES') OR " +
           "  (r.deviceId = :deviceId) " +
           ")")
    List<BlockRule> findActiveRulesForDevice(
        @Param("tenantId") UUID tenantId,
        @Param("deviceId") UUID deviceId
    );
}
