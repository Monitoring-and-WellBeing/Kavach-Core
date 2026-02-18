package com.kavach.devices;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public Device linkDevice(String deviceCode, String agentVersion, String osVersion) {
        Device device = deviceRepository.findByDeviceCode(deviceCode)
                .orElseThrow(() -> new RuntimeException("Invalid device code: " + deviceCode));
        device.setStatus("ONLINE");
        device.setAgentVersion(agentVersion);
        device.setOsVersion(osVersion);
        device.setLastSeen(Instant.now());
        return deviceRepository.save(device);
    }

    public List<Device> findByTenantId(UUID tenantId) {
        return deviceRepository.findByTenantId(tenantId);
    }

    public Device findById(UUID id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found: " + id));
    }

    public Device pause(UUID id) {
        Device device = findById(id);
        device.setStatus("PAUSED");
        device.setLastSeen(Instant.now());
        return deviceRepository.save(device);
    }

    public Device resume(UUID id) {
        Device device = findById(id);
        device.setStatus("ONLINE");
        device.setLastSeen(Instant.now());
        return deviceRepository.save(device);
    }

    public Device setFocusMode(UUID id) {
        Device device = findById(id);
        device.setStatus("FOCUS_MODE");
        device.setLastSeen(Instant.now());
        return deviceRepository.save(device);
    }

    public Device heartbeat(UUID id) {
        Device device = findById(id);
        device.setLastSeen(Instant.now());
        if ("OFFLINE".equals(device.getStatus())) {
            device.setStatus("ONLINE");
        }
        return deviceRepository.save(device);
    }

    public Device create(Device device) {
        device.setCreatedAt(Instant.now());
        device.setStatus("OFFLINE");
        return deviceRepository.save(device);
    }
}
