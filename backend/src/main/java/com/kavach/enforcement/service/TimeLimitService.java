package com.kavach.enforcement.service;

import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.enforcement.dto.TimeLimitEntryDto;
import com.kavach.enforcement.dto.TimeLimitStatusDto;
import com.kavach.enforcement.entity.DailyAppUsage;
import com.kavach.enforcement.entity.TimeLimitRule;
import com.kavach.enforcement.repository.DailyAppUsageRepository;
import com.kavach.enforcement.repository.TimeLimitRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeLimitService {

    private final DailyAppUsageRepository    usageRepository;
    private final TimeLimitRuleRepository    limitRuleRepository;
    private final AlertRepository            alertRepository;

    // ── Record usage from either client ──────────────────────────────────────

    /**
     * Accumulates incremental usage reported by the desktop agent or Android app.
     * After updating, checks if any time-limit threshold has been crossed.
     */
    @Transactional
    public void recordUsage(UUID deviceId, UUID tenantId,
                             String appCategory, String packageName,
                             int durationSeconds) {

        DailyAppUsage usage = usageRepository
            .findByDeviceIdAndDateAndCategoryAndPackage(
                deviceId, LocalDate.now(), appCategory, packageName)
            .orElse(DailyAppUsage.builder()
                .deviceId(deviceId)
                .tenantId(tenantId)
                .usageDate(LocalDate.now())
                .appCategory(appCategory)
                .packageName(packageName)
                .durationSeconds(0)
                .lastUpdated(Instant.now())
                .build());

        usage.setDurationSeconds(usage.getDurationSeconds() + durationSeconds);
        usage.setLastUpdated(Instant.now());
        usageRepository.save(usage);

        // Check thresholds after updating
        checkTimeLimits(deviceId, tenantId, appCategory, packageName,
                        usage.getDurationSeconds());

        log.debug("[time-limit] Recorded {}s of {} ({}) for device {}",
                  durationSeconds, appCategory, packageName, deviceId);
    }

    // ── Get current time limit status for a device ────────────────────────────

    /**
     * Returns how much time the student has used and how much remains for each
     * active time-limit rule today.  Both clients call this as part of the
     * unified enforcement state fetch.
     */
    public TimeLimitStatusDto getStatus(UUID deviceId, UUID tenantId) {
        List<TimeLimitRule> rules = limitRuleRepository
            .findActiveRulesForDevice(deviceId, tenantId);

        List<TimeLimitEntryDto> entries = new ArrayList<>();
        for (TimeLimitRule rule : rules) {
            int usedSeconds = usageRepository
                .getTodayUsage(deviceId, rule.getAppCategory(), rule.getPackageName());

            int remainingSeconds = Math.max(0,
                rule.getDailyLimitSeconds() - usedSeconds);
            boolean limitReached   = remainingSeconds == 0 && usedSeconds > 0;
            boolean warningThreshold = rule.getWarningAtSeconds() != null
                && usedSeconds >= rule.getWarningAtSeconds()
                && !limitReached;

            entries.add(TimeLimitEntryDto.builder()
                .ruleId(rule.getId())
                .appCategory(rule.getAppCategory())
                .packageName(rule.getPackageName())
                .dailyLimitSeconds(rule.getDailyLimitSeconds())
                .usedSeconds(usedSeconds)
                .remainingSeconds(remainingSeconds)
                .limitReached(limitReached)
                .warningThreshold(warningThreshold)
                .build());
        }

        return TimeLimitStatusDto.builder()
            .deviceId(deviceId)
            .date(LocalDate.now())
            .entries(entries)
            .build();
    }

    // ── Private: threshold checks → parent alerts ─────────────────────────────

    private void checkTimeLimits(UUID deviceId, UUID tenantId,
                                  String category, String packageName,
                                  int totalUsedSeconds) {

        List<TimeLimitRule> matchingRules = limitRuleRepository
            .findByDeviceAndCategory(deviceId, tenantId, category, packageName);

        for (TimeLimitRule rule : matchingRules) {

            // Warning threshold crossed (but limit not yet reached)
            if (rule.getWarningAtSeconds() != null
                && totalUsedSeconds >= rule.getWarningAtSeconds()
                && totalUsedSeconds < rule.getDailyLimitSeconds()) {

                int remainingMins =
                    (rule.getDailyLimitSeconds() - totalUsedSeconds) / 60;

                saveAlert(tenantId, deviceId,
                    "TIME_LIMIT_WARNING", "LOW",
                    category + " time limit warning",
                    String.format("%s: %d minutes remaining for today",
                                  category, remainingMins));
            }

            // Daily limit reached
            if (totalUsedSeconds >= rule.getDailyLimitSeconds()) {
                saveAlert(tenantId, deviceId,
                    "TIME_LIMIT_REACHED", "MEDIUM",
                    category + " daily limit reached",
                    String.format("%s daily limit reached on device — student blocked",
                                  category));
            }
        }
    }

    private void saveAlert(UUID tenantId, UUID deviceId,
                            String ruleType, String severity,
                            String title, String message) {
        try {
            alertRepository.save(Alert.builder()
                .tenantId(tenantId)
                .deviceId(deviceId)
                .ruleType(ruleType)
                .severity(severity)
                .title(title)
                .message(message)
                .build());
        } catch (Exception e) {
            log.warn("[time-limit] Failed to save alert: {}", e.getMessage());
        }
    }
}
