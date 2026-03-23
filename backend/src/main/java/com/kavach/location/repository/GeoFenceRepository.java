package com.kavach.location.repository;

import com.kavach.location.entity.GeoFence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GeoFenceRepository extends JpaRepository<GeoFence, UUID> {

    /** Active fences for a tenant — sent to mobile app on each open. */
    List<GeoFence> findByTenantIdAndActiveTrue(UUID tenantId);
}
