package com.kavach.enforcement.repository;

import com.kavach.enforcement.entity.EnforcementEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface EnforcementEventRepository extends JpaRepository<EnforcementEvent, UUID> {

    /** All events for a device, newest first (paged) */
    Page<EnforcementEvent> findByDeviceIdOrderByTimestampDesc(UUID deviceId, Pageable pageable);

    /** All events for a tenant, newest first (paged) — dashboard overview */
    Page<EnforcementEvent> findByTenantIdOrderByTimestampDesc(UUID tenantId, Pageable pageable);

    /** Count events for a device since a given timestamp — used for rate checks */
    long countByDeviceIdAndTimestampAfter(UUID deviceId, Instant since);

    /** Recent events for a specific action type (e.g. KILL_TOOL_DETECTED) */
    List<EnforcementEvent> findByTenantIdAndActionOrderByTimestampDesc(
            UUID tenantId, String action, Pageable pageable);
}
