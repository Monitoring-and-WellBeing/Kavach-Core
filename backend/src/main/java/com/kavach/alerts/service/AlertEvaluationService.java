package com.kavach.alerts.service;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.entity.AlertRule;
import com.kavach.alerts.entity.RuleType;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.alerts.repository.AlertRuleRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.repository.DeviceRepository;
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

        log.info("[alerts] Alert fired: {} for device {}", title, device.getName());
    }

    // ── Manual trigger from agent (blocked app attempt) ───────────────────────
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
