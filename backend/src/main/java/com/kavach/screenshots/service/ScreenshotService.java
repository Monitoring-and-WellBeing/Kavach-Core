package com.kavach.screenshots.service;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.screenshots.dto.ScreenshotDto;
import com.kavach.screenshots.dto.ScreenshotSettingsDto;
import com.kavach.screenshots.entity.Screenshot;
import com.kavach.screenshots.entity.ScreenshotSettings;
import com.kavach.screenshots.entity.ScreenshotTrigger;
import com.kavach.screenshots.repository.ScreenshotRepository;
import com.kavach.screenshots.repository.ScreenshotSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreenshotService {

    private final ScreenshotRepository screenshotRepo;
    private final ScreenshotSettingsRepository settingsRepo;
    private final DeviceRepository deviceRepo;
    private final R2StorageService r2;

    // ── Upload (called by desktop agent) ─────────────────────────────────────

    @Transactional
    public ScreenshotDto save(
            UUID deviceId,
            String trigger,
            String ruleIdStr,
            String appName,
            byte[] imageBytes
    ) {
        var device = deviceRepo.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        UUID tenantId  = device.getTenantId();
        Instant now    = Instant.now();
        String dateStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String key     = tenantId + "/" + deviceId + "/" + dateStr + "/" + now.toEpochMilli() + ".jpg";

        // Upload to R2 (fire & continue — if R2 not configured, key is still stored)
        r2.uploadScreenshot(key, imageBytes, "image/jpeg");

        ScreenshotTrigger triggerType = ScreenshotTrigger.valueOf(trigger.toUpperCase());
        UUID ruleId = ruleIdStr != null && !ruleIdStr.isBlank() ? UUID.fromString(ruleIdStr) : null;

        Screenshot shot = Screenshot.builder()
                .deviceId(deviceId)
                .tenantId(tenantId)
                .r2Key(key)
                .triggerType(triggerType)
                .ruleId(ruleId)
                .appName(appName)
                .fileSizeKb(imageBytes.length / 1024)
                .capturedAt(now)
                .build();

        shot = screenshotRepo.save(shot);
        log.info("[screenshots] Saved {} screenshot for device {} ({} KB)",
                triggerType, deviceId, shot.getFileSizeKb());

        return toDto(shot);
    }

    // ── Query (called by parent dashboard) ────────────────────────────────────

    public List<ScreenshotDto> getForDevice(UUID deviceId, LocalDate date, UUID tenantId) {
        Instant from = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to   = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        return screenshotRepo
                .findByDeviceIdAndTenantIdAndCapturedAtBetweenOrderByCapturedAtDesc(
                        deviceId, tenantId, from, to)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public String getSignedUrl(UUID id, UUID tenantId) {
        Screenshot shot = screenshotRepo.findById(id)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Screenshot not found or access denied"));
        return r2.generatePresignedUrl(shot.getR2Key());
    }

    @Transactional
    public void delete(UUID id, UUID tenantId) {
        Screenshot shot = screenshotRepo.findById(id)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Screenshot not found or access denied"));
        r2.deleteObject(shot.getR2Key());
        screenshotRepo.delete(shot);
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    public ScreenshotSettingsDto getSettings(UUID deviceId) {
        UUID tenantId = deviceRepo.findById(deviceId)
                .map(d -> d.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Device not found"));
        return getSettingsForTenant(tenantId);
    }

    public ScreenshotSettingsDto getSettingsForTenant(UUID tenantId) {
        ScreenshotSettings s = settingsRepo.findById(tenantId)
                .orElseGet(() -> defaultSettings(tenantId));
        return toSettingsDto(s);
    }

    @Transactional
    public ScreenshotSettingsDto updateSettings(UUID tenantId, ScreenshotSettingsDto dto) {
        ScreenshotSettings s = settingsRepo.findById(tenantId)
                .orElseGet(() -> defaultSettings(tenantId));

        s.setEnabled(dto.isEnabled());
        s.setPeriodicEnabled(dto.isPeriodicEnabled());
        s.setPeriodicIntervalMin(dto.getPeriodicIntervalMin());
        s.setViolationEnabled(dto.isViolationEnabled());
        s.setSchoolHoursOnly(dto.isSchoolHoursOnly());
        s.setSchoolStart(LocalTime.parse(dto.getSchoolStart()));
        s.setSchoolEnd(LocalTime.parse(dto.getSchoolEnd()));
        s.setRetentionDays(dto.getRetentionDays());
        s.setUpdatedAt(java.time.Instant.now());

        s = settingsRepo.save(s);
        return toSettingsDto(s);
    }

    @Transactional
    public void markStudentNotified(UUID deviceId) {
        UUID tenantId = deviceRepo.findById(deviceId)
                .map(d -> d.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Device not found"));

        ScreenshotSettings s = settingsRepo.findById(tenantId)
                .orElseGet(() -> defaultSettings(tenantId));
        s.setStudentNotified(true);
        s.setUpdatedAt(java.time.Instant.now());
        settingsRepo.save(s);
        log.info("[screenshots] Student disclosure acknowledged for tenant {}", tenantId);
    }

    // ── Auto-purge (runs nightly at 02:00) ────────────────────────────────────

    @Scheduled(cron = "0 0 2 * * *")
    @SchedulerLock(name = "purgeExpiredScreenshots", lockAtLeastFor = "PT30M", lockAtMostFor = "PT2H")
    @Transactional
    public void purgeExpiredScreenshots() {
        log.info("[screenshots] Starting nightly purge of expired screenshots");

        settingsRepo.findAll().forEach(settings -> {
            if (!settings.isEnabled()) return;

            Instant cutoff = Instant.now()
                    .minus(Duration.ofDays(settings.getRetentionDays()));
            List<Screenshot> old = screenshotRepo
                    .findByTenantIdAndCapturedAtBefore(settings.getTenantId(), cutoff);

            old.forEach(shot -> {
                r2.deleteObject(shot.getR2Key());
                screenshotRepo.delete(shot);
            });

            if (!old.isEmpty()) {
                log.info("[screenshots] Purged {} screenshots for tenant {}",
                        old.size(), settings.getTenantId());
            }
        });
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ScreenshotSettings defaultSettings(UUID tenantId) {
        return ScreenshotSettings.builder()
                .tenantId(tenantId)
                .enabled(false)
                .periodicEnabled(false)
                .periodicIntervalMin(5)
                .violationEnabled(true)
                .schoolHoursOnly(true)
                .schoolStart(LocalTime.of(8, 0))
                .schoolEnd(LocalTime.of(16, 0))
                .retentionDays(7)
                .studentNotified(false)
                .build();
    }

    private ScreenshotDto toDto(Screenshot s) {
        return ScreenshotDto.builder()
                .id(s.getId())
                .deviceId(s.getDeviceId())
                .triggerType(s.getTriggerType())
                .ruleId(s.getRuleId())
                .appName(s.getAppName())
                .fileSizeKb(s.getFileSizeKb())
                .capturedAt(s.getCapturedAt())
                .build();
    }

    private ScreenshotSettingsDto toSettingsDto(ScreenshotSettings s) {
        return ScreenshotSettingsDto.builder()
                .enabled(s.isEnabled())
                .periodicEnabled(s.isPeriodicEnabled())
                .periodicIntervalMin(s.getPeriodicIntervalMin())
                .violationEnabled(s.isViolationEnabled())
                .schoolHoursOnly(s.isSchoolHoursOnly())
                .schoolStart(s.getSchoolStart().toString())
                .schoolEnd(s.getSchoolEnd().toString())
                .retentionDays(s.getRetentionDays())
                .studentNotified(s.isStudentNotified())
                .build();
    }
}
