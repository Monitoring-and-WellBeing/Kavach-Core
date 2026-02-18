package com.kavach.devices;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
    List<Device> findByTenantId(UUID tenantId);
    Optional<Device> findByDeviceCode(String deviceCode);
}
