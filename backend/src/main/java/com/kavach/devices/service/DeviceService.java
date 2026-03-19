package com.kavach.devices.service;

import com.kavach.devices.dto.*;
import com.kavach.devices.entity.*;
import com.kavach.devices.repository.*;
import com.kavach.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepo;
    private final DeviceLinkCodeRepository codeRepo;
    private final SubscriptionService subscriptionService;

    // ── Generate a new 6-char linking code (called by desktop agent) ──────────
    @Transactional
    public GenerateCodeResponse generateCode() {
        // Cleanup expired codes
        codeRepo.deleteExpiredCodes(LocalDateTime.now());

        String code = generateUniqueCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        DeviceLinkCode linkCode = DeviceLinkCode.builder()
                .code(code)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        codeRepo.save(linkCode);

        return GenerateCodeResponse.builder()
                .code(code)
                .expiresAt(expiresAt)
                .expiresInMinutes(15)
                .build();
    }

    // ── Link device to tenant using the code ──────────────────────────────────
    @Transactional
    public DeviceDto linkDevice(UUID tenantId, LinkDeviceRequest req) {
        // Check device limit before linking
        if (!subscriptionService.canAddDevice(tenantId)) {
            throw new IllegalArgumentException("Device limit reached for your plan. Please upgrade to add more devices.");
        }

        DeviceLinkCode linkCode = codeRepo.findByCodeAndUsedFalse(req.getCode().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired code: " + req.getCode()));

        if (linkCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Code has expired. Please generate a new one.");
        }

        // Create device record
        Device device = Device.builder()
                .tenantId(tenantId)
                .name(req.getDeviceName() != null && !req.getDeviceName().isBlank()
                      ? req.getDeviceName() : "Device " + req.getCode())
                .type(DeviceType.DESKTOP)
                .status(DeviceStatus.OFFLINE)
                .assignedTo(req.getAssignedTo())
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        device = deviceRepo.save(device);

        // Mark code as used and associate with device
        linkCode.setUsed(true);
        linkCode.setTenantId(tenantId);
        linkCode.setDevice(device);
        codeRepo.save(linkCode);

        return toDto(device);
    }

    // ── List all devices for a tenant ─────────────────────────────────────────
    public List<DeviceDto> getDevicesByTenant(UUID tenantId) {
        return deviceRepo.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    // ── Get single device ─────────────────────────────────────────────────────
    public DeviceDto getDevice(UUID deviceId, UUID tenantId) {
        Device device = deviceRepo.findById(deviceId)
                .filter(d -> d.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Device not found"));
        return toDto(device);
    }

    // ── Update device name / assignedTo ───────────────────────────────────────
    @Transactional
    public DeviceDto updateDevice(UUID deviceId, UUID tenantId, UpdateDeviceRequest req) {
        Device device = deviceRepo.findById(deviceId)
                .filter(d -> d.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Device not found"));

        if (req.getName() != null) device.setName(req.getName());
        if (req.getAssignedTo() != null) device.setAssignedTo(req.getAssignedTo());
        device.setUpdatedAt(LocalDateTime.now());

        return toDto(deviceRepo.save(device));
    }

    // ── Pause device ──────────────────────────────────────────────────────────
    @Transactional
    public DeviceDto pauseDevice(UUID deviceId, UUID tenantId) {
        return updateDeviceStatus(deviceId, tenantId, DeviceStatus.PAUSED);
    }

    // ── Resume device ─────────────────────────────────────────────────────────
    @Transactional
    public DeviceDto resumeDevice(UUID deviceId, UUID tenantId) {
        return updateDeviceStatus(deviceId, tenantId, DeviceStatus.ONLINE);
    }

    // ── Remove device (soft delete) ───────────────────────────────────────────
    @Transactional
    public void removeDevice(UUID deviceId, UUID tenantId) {
        Device device = deviceRepo.findById(deviceId)
                .filter(d -> d.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Device not found"));
        device.setActive(false);
        device.setUpdatedAt(LocalDateTime.now());
        deviceRepo.save(device);
    }

    // ── Agent heartbeat — marks device ONLINE ────────────────────────────────
    @Transactional
    public void heartbeat(UUID deviceId, String agentVersion, String osVersion, String hostname) {
        deviceRepo.findById(deviceId).ifPresent(d -> {
            d.setLastSeen(LocalDateTime.now());
            d.setStatus(DeviceStatus.ONLINE);
            if (agentVersion != null) d.setAgentVersion(agentVersion);
            if (osVersion != null) d.setOsVersion(osVersion);
            if (hostname != null) d.setHostname(hostname);
            d.setUpdatedAt(LocalDateTime.now());
            deviceRepo.save(d);
        });
    }

    // ── Auto-mark devices OFFLINE if no heartbeat in 2 minutes ───────────────
    @Scheduled(fixedDelay = 60000) // every 60 seconds
    @Transactional
    public void markStaleDevicesOffline() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(2);
        // Use a scoped query instead of findAll() to avoid loading every device
        // across all tenants into heap.
        deviceRepo.findOnlineDevicesLastSeenBefore(threshold).forEach(d -> {
            d.setStatus(DeviceStatus.OFFLINE);
            d.setUpdatedAt(LocalDateTime.now());
            deviceRepo.save(d);
        });
    }

    // ── Helper: update status ─────────────────────────────────────────────────
    private DeviceDto updateDeviceStatus(UUID deviceId, UUID tenantId, DeviceStatus status) {
        Device device = deviceRepo.findById(deviceId)
                .filter(d -> d.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Device not found"));
        device.setStatus(status);
        device.setUpdatedAt(LocalDateTime.now());
        return toDto(deviceRepo.save(device));
    }

    // ── Generate random uppercase 6-char code ─────────────────────────────────
    private String generateUniqueCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0,O,1,I to avoid confusion
        Random random = new Random();
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
            code = sb.toString();
        } while (codeRepo.findByCodeAndUsedFalse(code).isPresent());
        return code;
    }

    // ── Map entity → DTO ──────────────────────────────────────────────────────
    private DeviceDto toDto(Device d) {
        return DeviceDto.builder()
                .id(d.getId())
                .name(d.getName())
                .type(d.getType().name())
                .status(d.getStatus().name())
                .osVersion(d.getOsVersion())
                .agentVersion(d.getAgentVersion())
                .hostname(d.getHostname())
                .lastSeen(d.getLastSeen())
                .assignedTo(d.getAssignedTo())
                .tenantId(d.getTenantId())
                .screenTimeToday(0) // populated in Feature 05
                .lastSeenRelative(formatRelativeTime(d.getLastSeen()))
                .build();
    }

    // ── Check if a code has been linked (for desktop agent polling) ─────────
    public Optional<DeviceLinkCode> checkLinked(String code) {
        return codeRepo.findByCode(code.toUpperCase());
    }

    private String formatRelativeTime(LocalDateTime time) {
        if (time == null) return "Never";
        long minutes = ChronoUnit.MINUTES.between(time, LocalDateTime.now());
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + " min ago";
        long hours = ChronoUnit.HOURS.between(time, LocalDateTime.now());
        if (hours < 24) return hours + "h ago";
        return ChronoUnit.DAYS.between(time, LocalDateTime.now()) + "d ago";
    }
}
