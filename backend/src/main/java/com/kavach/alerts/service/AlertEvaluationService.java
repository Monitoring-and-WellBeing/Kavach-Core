package com.kavach.alerts.service;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.entity.AlertRule;
import com.kavach.alerts.entity.RuleType;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.alerts.repository.AlertRuleRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.sse.SseRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertEvaluationService {

    private final AlertRuleRepository ruleRepo;
    private final AlertRepository alertRepo;
    private final ActivityLogRepository activityRepo;
    private final DeviceRepository deviceRepo;
    private final SseRegistry sseRegistry;

    // ── Run every 5 minutes ───────────────────────────────────────────────────
    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void evaluateAllRules() {
        List<AlertRule> activeRules = ruleRepo.findAll().stream()
            .filter(AlertRule::isActive)
            .toList();

        log.debug("[alerts] Evaluating {} active rules", activeRules.size());

        for (AlertRule rule : activeRules) {
            try {
                evaluateRule(rule);
            } catch (Exception e) {
                log.warn("[alerts] Rule evaluation failed for {}: {}", rule.getId(), e.getMessage());
            }
        }
    }

    private void evaluateRule(AlertRule rule) {
        // Check cooldown — don't re-trigger within cooldown window
        if (rule.getLastTriggered() != null) {
            long minutesSince = ChronoUnit.MINUTES.between(rule.getLastTriggered(), LocalDateTime.now());
            if (minutesSince < rule.getCooldownMinutes()) return;
        }

        // Get devices to evaluate
        List<Device> devices;
        if ("SPECIFIC_DEVICE".equals(rule.getAppliesTo()) && rule.getDeviceId() != null) {
            devices = deviceRepo.findById(rule.getDeviceId()).map(List::of).orElse(List.of());
        } else {
            devices = deviceRepo.findByTenantIdAndActiveTrue(rule.getTenantId());
        }

        for (Device device : devices) {
            checkRuleForDevice(rule, device);
        }
    }

    private void checkRuleForDevice(AlertRule rule, Device device) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        Map<String, Object> cfg = rule.getConfig();

        switch (rule.getRuleType()) {

            case SCREEN_TIME_EXCEEDED -> {
                int threshold = toInt(cfg.get("totalMinutes"));
                Long totalSecs = activityRepo.totalDurationSince(device.getId(), startOfDay);
                long totalMins = (totalSecs != null ? totalSecs : 0L) / 60;
                if (totalMins >= threshold) {
                    fireAlert(rule, device,
                        "Screen time limit exceeded on " + device.getName(),
                        String.format("%s has used the device for %d minutes today, exceeding the %d minute limit.",
                            device.getAssignedTo() != null ? device.getAssignedTo() : device.getName(),
                            totalMins, threshold),
                        Map.of("usageMinutes", totalMins, "thresholdMinutes", threshold,
                               "deviceName", device.getName())
                    );
                }
            }

            case APP_USAGE_EXCEEDED -> {
                String appName = (String) cfg.get("appName");
                int threshold = toInt(cfg.get("thresholdMinutes"));
                if (appName == null) return;

                long appSecs = getAppUsageToday(device.getId(), appName);
                long appMins = appSecs / 60;
                if (appMins >= threshold) {
                    fireAlert(rule, device,
                        appName + " usage limit reached on " + device.getName(),
                        String.format("%s has been used for %d minutes today, exceeding the %d minute daily limit.",
                            appName, appMins, threshold),
                        Map.of("appName", appName, "usageMinutes", appMins,
                               "thresholdMinutes", threshold, "deviceName", device.getName())
                    );
                }
            }

            case CATEGORY_USAGE_EXCEEDED -> {
                String category = (String) cfg.get("category");
                int threshold = toInt(cfg.get("thresholdMinutes"));
                if (category == null) return;

                long catSecs = getCategoryUsageToday(device.getId(), category);
                long catMins = catSecs / 60;
                if (catMins >= threshold) {
                    fireAlert(rule, device,
                        category.charAt(0) + category.substring(1).toLowerCase() + " usage exceeded on " + device.getName(),
                        String.format("%s apps used for %d minutes today, exceeding the %d minute limit.",
                            category.toLowerCase(), catMins, threshold),
                        Map.of("category", category, "usageMinutes", catMins,
                               "thresholdMinutes", threshold, "deviceName", device.getName())
                    );
                }
            }

            case LATE_NIGHT_USAGE -> {
                int startHour = toInt(cfg.getOrDefault("startHour", 22));
                int currentHour = LocalTime.now().getHour();
                // Trigger if current time is in late night window
                boolean isLateNight = currentHour >= startHour || currentHour < 6;

                if (isLateNight && device.getLastSeen() != null) {
                    long minsSinceSeen = ChronoUnit.MINUTES.between(device.getLastSeen(), LocalDateTime.now());
                    if (minsSinceSeen < 10) { // device was active in last 10 mins
                        fireAlert(rule, device,
                            "Late night usage detected on " + device.getName(),
                            String.format("Device activity detected at %d:00. Consider enabling Wind-Down mode.", currentHour),
                            Map.of("hour", currentHour, "deviceName", device.getName())
                        );
                    }
                }
            }

            default -> log.debug("[alerts] Unhandled rule type: {}", rule.getRuleType());
        }
    }

    @Transactional
    public void fireAlert(AlertRule rule, Device device, String title, String message, Map<String, Object> metadata) {
        Alert alert = Alert.builder()
            .tenantId(rule.getTenantId())
            .ruleId(rule.getId())
            .deviceId(device.getId())
            .ruleType(rule.getRuleType().name())
            .severity(rule.getSeverity())
            .title(title)
            .message(message)
            .metadata(metadata)
            .build();

        alertRepo.save(alert);

        // Update rule's last triggered time
        rule.setLastTriggered(LocalDateTime.now());
        ruleRepo.save(rule);

        // ── Push real-time alert to parent dashboard via SSE ──────────────────
        Map<String, Object> sseAlert = new java.util.HashMap<>();
        sseAlert.put("id",         String.valueOf(alert.getId()));
        sseAlert.put("title",      alert.getTitle());
        sseAlert.put("message",    alert.getMessage());
        sseAlert.put("severity",   alert.getSeverity());
        sseAlert.put("ruleType",   alert.getRuleType());
        sseAlert.put("deviceId",   String.valueOf(device.getId()));
        sseAlert.put("deviceName", device.getName());
        sseRegistry.sendToTenant(rule.getTenantId(), "alert", sseAlert);

        log.info("[alerts] Alert fired: {} for device {}", title, device.getName());
    }

    // ── Manual trigger from agent (blocked app attempt) ───────────────────────
    @Transactional
    public void triggerKillToolAlert(UUID tenantId, UUID deviceId, String toolName, String deviceName) {
        Alert alert = Alert.builder()
            .tenantId(tenantId)
            .deviceId(deviceId)
            .ruleType("KILL_TOOL_DETECTED")
            .severity("HIGH")
            .title("Bypass attempt on " + deviceName)
            .message(String.format(
                "'%s' was opened on %s — possible attempt to bypass KAVACH monitoring.",
                toolName, deviceName))
            .metadata(Map.of("toolName", toolName, "deviceName", deviceName))
            .build();
        alertRepo.save(alert);
        Map<String, Object> killPayload = new java.util.HashMap<>();
        killPayload.put("id", String.valueOf(alert.getId()));
        killPayload.put("title", alert.getTitle());
        killPayload.put("message", alert.getMessage());
        killPayload.put("severity", "HIGH");
        killPayload.put("ruleType", "KILL_TOOL_DETECTED");
        killPayload.put("deviceId", String.valueOf(deviceId));
        sseRegistry.sendToTenant(tenantId, "alert", killPayload);
        log.warn("[alerts] Kill-tool alert: {} on {}", toolName, deviceName);
    }

    @Transactional
    public void triggerBlockedAppAlert(UUID tenantId, UUID deviceId, String appName, String deviceName) {
        Alert alert = Alert.builder()
            .tenantId(tenantId)
            .deviceId(deviceId)
            .ruleType("BLOCKED_APP_ATTEMPT")
            .severity("MEDIUM")
            .title("Blocked app attempted on " + deviceName)
            .message(String.format("Attempt to open blocked app '%s' was detected and blocked.", appName))
            .metadata(Map.of("appName", appName, "deviceName", deviceName))
            .build();
        alertRepo.save(alert);
        Map<String, Object> blockedPayload = new java.util.HashMap<>();
        blockedPayload.put("id", String.valueOf(alert.getId()));
        blockedPayload.put("title", alert.getTitle());
        blockedPayload.put("message", alert.getMessage());
        blockedPayload.put("severity", "MEDIUM");
        blockedPayload.put("ruleType", "BLOCKED_APP_ATTEMPT");
        blockedPayload.put("deviceId", String.valueOf(deviceId));
        sseRegistry.sendToTenant(tenantId, "alert", blockedPayload);
    }

    @Transactional
    public void triggerGeoFenceAlert(UUID tenantId, UUID deviceId, String regionName,
                                      String eventType, String deviceName) {
        boolean exited = "EXITED".equalsIgnoreCase(eventType);
        String title = exited
            ? deviceName + " left " + regionName
            : deviceName + " entered " + regionName;
        String message = exited
            ? String.format("%s has left the '%s' zone.", deviceName, regionName)
            : String.format("%s has entered the '%s' zone.", deviceName, regionName);

        Alert alert = Alert.builder()
            .tenantId(tenantId)
            .deviceId(deviceId)
            .ruleType("GEOFENCE_EVENT")
            .severity("MEDIUM")
            .title(title)
            .message(message)
            .metadata(Map.of("regionName", regionName, "eventType", eventType,
                             "deviceName", deviceName))
            .build();
        alertRepo.save(alert);
        log.info("[alerts] Geo-fence alert: {} {} {}", deviceName, eventType, regionName);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private long getAppUsageToday(UUID deviceId, String appName) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return activityRepo.topAppsSince(deviceId, startOfDay).stream()
            .filter(row -> appName.equalsIgnoreCase((String) row[0]))
            .mapToLong(row -> ((Number) row[2]).longValue())
            .sum();
    }

    private long getCategoryUsageToday(UUID deviceId, String category) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return activityRepo.categoryBreakdown(deviceId, startOfDay).stream()
            .filter(row -> category.equalsIgnoreCase(row[0].toString()))
            .mapToLong(row -> ((Number) row[1]).longValue())
            .sum();
    }

    private int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(value.toString()); } catch (Exception e) { return 0; }
    }
}
