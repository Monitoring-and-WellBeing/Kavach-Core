package com.kavach.devices.repository;

import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
    List<Device> findByTenantIdAndActiveTrue(UUID tenantId);
    List<Device> findByTenantIdAndStatusAndActiveTrue(UUID tenantId, DeviceStatus status);
    long countByTenantIdAndActiveTrue(UUID tenantId);
    long countByTenantIdAndStatus(UUID tenantId, DeviceStatus status);

    @Modifying
    @Query("UPDATE Device d SET d.status = :status, d.updatedAt = CURRENT_TIMESTAMP WHERE d.id = :id")
    void updateStatus(UUID id, DeviceStatus status);
}
