package com.kavach.activity.service;

import com.kavach.activity.dto.SyncActivityRequest;
import com.kavach.activity.entity.ActivityLog;
import com.kavach.activity.entity.AppCategory;
import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.devices.entity.Device;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final ActivityLogRepository activityRepo;
    private final DeviceRepository deviceRepo;

    @Transactional
    public int syncLogs(SyncActivityRequest req) {
        // Verify device exists and get tenantId
        var device = deviceRepo.findById(req.getDeviceId())
                .orElseThrow(() -> new IllegalArgumentException("Device not found: " + req.getDeviceId()));

        int saved = 0;
        for (SyncActivityRequest.LogEntry entry : req.getLogs()) {
            try {
                ActivityLog log = ActivityLog.builder()
                        .deviceId(req.getDeviceId())
                        .tenantId(device.getTenantId())
                        .appName(entry.getAppName())
                        .processName(entry.getProcessName())
                        .windowTitle(entry.getWindowTitle())
                        .category(parseCategory(entry.getCategory()))
                        .durationSeconds(Math.max(entry.getDurationSeconds(), 1))
                        .startedAt(parseDateTime(entry.getStartedAt()))
                        .endedAt(entry.getEndedAt() != null ? parseDateTime(entry.getEndedAt()) : null)
                        .blocked(entry.isBlocked())
                        .build();

                activityRepo.save(log);
                saved++;
            } catch (Exception e) {
                log.warn("[activity] Skipping invalid log entry: {}", e.getMessage());
            }
        }

        log.info("[activity] Saved {}/{} logs for device {}", saved, req.getLogs().size(), req.getDeviceId());
        return saved;
    }

    public long getScreenTimeToday(UUID deviceId) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return activityRepo.totalDurationSince(deviceId, startOfDay);
    }

    public List<Object[]> getTopAppsToday(UUID deviceId) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return activityRepo.topAppsSince(deviceId, startOfDay);
    }

    private AppCategory parseCategory(String cat) {
        try { return AppCategory.valueOf(cat.toUpperCase()); }
        catch (Exception e) { return AppCategory.OTHER; }
    }

    private LocalDateTime parseDateTime(String iso) {
        try { return ZonedDateTime.parse(iso).toLocalDateTime(); }
        catch (Exception e) { return LocalDateTime.parse(iso); }
    }
}
