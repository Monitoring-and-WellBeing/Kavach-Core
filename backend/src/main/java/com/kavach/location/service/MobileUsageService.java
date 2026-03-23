package com.kavach.location.service;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.location.dto.MobileUsageRequest;
import com.kavach.location.entity.MobileAppUsage;
import com.kavach.location.repository.MobileAppUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobileUsageService {

    private final MobileAppUsageRepository usageRepo;
    private final DeviceRepository deviceRepo;

    /**
     * Persist one 30-minute usage report from the mobile device.
     *
     * @param deviceId the authenticated device's UUID
     * @param req      the usage payload
     * @return number of app-usage rows saved
     */
    @Transactional
    public int saveUsage(MobileUsageRequest req) {
        UUID deviceId = req.getDeviceId();
        var device = deviceRepo.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        Instant periodStart = Instant.parse(req.getPeriodStart());
        Instant periodEnd   = Instant.parse(req.getPeriodEnd());

        int saved = 0;
        for (MobileUsageRequest.AppEntry entry : req.getAppUsage()) {
            MobileAppUsage row = MobileAppUsage.builder()
                    .deviceId(deviceId)
                    .tenantId(device.getTenantId())
                    .packageName(entry.getPackageName())
                    .appName(entry.getAppName() != null ? entry.getAppName() : entry.getPackageName())
                    .durationMs(entry.getDurationMs())
                    .lastUsed(entry.getLastUsed() != null ? Instant.parse(entry.getLastUsed()) : null)
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .build();
            usageRepo.save(row);
            saved++;
        }

        log.info("[mobile-usage] Saved {} app entries for device {} ({}–{})",
                saved, device.getName(), req.getPeriodStart(), req.getPeriodEnd());
        return saved;
    }
}
