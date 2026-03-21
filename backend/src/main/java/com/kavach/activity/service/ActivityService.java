package com.kavach.activity.service;

import com.kavach.activity.dto.ActivityLogResponse;
import com.kavach.activity.dto.SyncActivityRequest;
import com.kavach.activity.entity.ActivityLog;
import com.kavach.activity.entity.AppCategory;
import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.devices.entity.Device;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

    public List<ActivityLogResponse> getLogs(UUID tenantId, UUID deviceId, int hours, int limit) {
        int cap = Math.min(limit, 500);
        LocalDateTime since = LocalDateTime.now().minusHours(Math.max(hours, 1));
        var pageable = PageRequest.of(0, cap);

        // Build device-name lookup for this tenant (avoids N+1)
        Map<UUID, String> deviceNames = deviceRepo.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .collect(Collectors.toMap(Device::getId, Device::getName));

        List<ActivityLog> logs = deviceId != null
                ? activityRepo.findRecentByDeviceIdAndTenantId(deviceId, tenantId, since, pageable)
                : activityRepo.findRecentByTenantId(tenantId, since, pageable);

        return logs.stream().map(a -> ActivityLogResponse.builder()
                .id(a.getId())
                .deviceId(a.getDeviceId())
                .deviceName(deviceNames.getOrDefault(a.getDeviceId(), "Unknown Device"))
                .appName(a.getAppName())
                .processName(a.getProcessName())
                .windowTitle(a.getWindowTitle())
                .category(a.getCategory() != null ? a.getCategory().name() : "OTHER")
                .durationSeconds(a.getDurationSeconds())
                .durationFormatted(formatDuration(a.getDurationSeconds()))
                .startedAt(a.getStartedAt())
                .endedAt(a.getEndedAt())
                .blocked(a.isBlocked())
                .build()
        ).toList();
    }

    private String formatDuration(int seconds) {
        if (seconds < 60) return seconds + "s";
        if (seconds < 3600) return (seconds / 60) + "m " + (seconds % 60) + "s";
        return (seconds / 3600) + "h " + ((seconds % 3600) / 60) + "m";
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
