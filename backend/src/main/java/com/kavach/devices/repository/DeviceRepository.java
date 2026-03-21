package com.kavach.devices.repository;

import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
    List<Device> findAllByActiveTrue();
    List<Device> findByTenantIdAndActiveTrue(UUID tenantId);
    List<Device> findByTenantIdAndStatusAndActiveTrue(UUID tenantId, DeviceStatus status);
    long countByTenantIdAndActiveTrue(UUID tenantId);
    long countByTenantIdAndStatus(UUID tenantId, DeviceStatus status);

    /**
     * Returns only ONLINE active devices whose last heartbeat is older than the given
     * threshold.  Used by the stale-device scheduled task to avoid loading the entire
     * devices table into the JVM heap.
     */
    @Query("SELECT d FROM Device d WHERE d.active = true AND d.status = com.kavach.devices.entity.DeviceStatus.ONLINE " +
           "AND d.lastSeen IS NOT NULL AND d.lastSeen < :threshold")
    List<Device> findOnlineDevicesLastSeenBefore(@Param("threshold") LocalDateTime threshold);

    @Modifying
    @Query("UPDATE Device d SET d.status = :status, d.updatedAt = CURRENT_TIMESTAMP WHERE d.id = :id")
    void updateStatus(UUID id, DeviceStatus status);

    boolean existsByIdAndDeviceSecret(UUID id, String deviceSecret); // GAP-5 FIXED
}
