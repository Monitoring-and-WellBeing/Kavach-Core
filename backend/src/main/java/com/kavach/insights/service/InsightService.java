package com.kavach.insights.service;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.ai.service.MoodService;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.insights.dto.InsightDto;
import com.kavach.insights.entity.AiInsight;
import com.kavach.insights.repository.AiInsightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsightService {

    private final AiInsightRepository insightRepo;
    private final ActivityLogRepository activityRepo;
    private final FocusSessionRepository focusRepo;
    private final DeviceRepository deviceRepo;
    private final GeminiService geminiService;
    private final MoodService moodService;

    private static final int CACHE_HOURS = 4;

    // ── Get insights (use cache or generate) ──────────────────────────────────
    public InsightDto getInsights(UUID deviceId, UUID tenantId) {
        // Check cache
        Optional<AiInsight> cached = insightRepo
            .findTopByDeviceIdOrderByGeneratedAtDesc(deviceId);

        if (cached.isPresent()) {
            AiInsight insight = cached.get();
            long hoursOld = ChronoUnit.HOURS.between(insight.getGeneratedAt(), LocalDateTime.now());
            if (hoursOld < CACHE_HOURS) {
                return toDto(insight, true);
            }
        }

        // Generate fresh insights
        return generateInsights(deviceId, tenantId);
    }

    // ── Force regenerate ──────────────────────────────────────────────────────
    @Transactional
    public InsightDto refreshInsights(UUID deviceId, UUID tenantId) {
        return generateInsights(deviceId, tenantId);
    }

    // ── Generate from activity data ───────────────────────────────────────────
    @Transactional
    private InsightDto generateInsights(UUID deviceId, UUID tenantId) {
        var device = deviceRepo.findById(deviceId)
            .orElseThrow(() -> new NoSuchElementException("Device not found"));

        LocalDateTime dataTo   = LocalDateTime.now();
        LocalDateTime dataFrom = dataTo.minusDays(7);

        // Build activity summary string for AI analysis
        String summary = buildActivitySummary(deviceId, dataFrom);

        String studentName = device.getAssignedTo() != null
            ? device.getAssignedTo() : "Student";

        // Build mood summary for richer parent digest
        String moodSummary = buildMoodSummary(deviceId, studentName);

        log.info("[insights] Generating insights for device {} ({})", deviceId, studentName);

        // Call Gemini AI service with enhanced context including mood
        Map<String, Object> aiResponse = geminiService.analyzeStudentActivity(
            summary, moodSummary, studentName, device.getName());

        // Parse and save
        AiInsight insight = AiInsight.builder()
            .tenantId(tenantId)
            .deviceId(deviceId)
            .rawResponse(aiResponse.toString())
            .weeklySummary((String) aiResponse.get("weekly_summary"))
            .riskLevel(((String) aiResponse.getOrDefault("risk_level", "LOW")).toUpperCase())
            .riskTags(toStringArray(aiResponse.get("risk_tags")))
            .positiveTags(toStringArray(aiResponse.get("positive_tags")))
            .insights((List<Map<String, Object>>) aiResponse.get("insights"))
            .dataFrom(dataFrom)
            .dateTo(dataTo)
            .build();

        insight = insightRepo.save(insight);
        return toDto(insight, true);
    }

    // ── Build mood summary for AI prompt ──────────────────────────────────────
    private String buildMoodSummary(UUID deviceId, String studentName) {
        try {
            return moodService.getWeeklyMoodSummaryByDevice(deviceId);
        } catch (Exception e) {
            return "No mood data available.";
        }
    }

    // ── Build activity summary text for AI prompt ───────────────────────────
    private String buildActivitySummary(UUID deviceId, LocalDateTime from) {
        StringBuilder sb = new StringBuilder();

        // Daily screen time for last 7 days
        sb.append("DAILY SCREEN TIME (last 7 days):\n");
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long secs = activityRepo.totalDurationSince(deviceId, date.atStartOfDay());
            long mins = secs / 60;
            sb.append(String.format("  %s: %dh %dm\n",
                date.getDayOfWeek().toString().substring(0, 3),
                mins / 60, mins % 60));
        }

        // Category breakdown for the week
        sb.append("\nCATEGORY BREAKDOWN (7 days):\n");
        activityRepo.categoryBreakdown(deviceId, from).forEach(row -> {
            long mins = ((Number) row[1]).longValue() / 60;
            sb.append(String.format("  %s: %dh %dm\n", row[0], mins / 60, mins % 60));
        });

        // Top apps for the week
        sb.append("\nTOP APPS (7 days):\n");
        activityRepo.topAppsSince(deviceId, from).stream().limit(8).forEach(row -> {
            long mins = ((Number) row[2]).longValue() / 60;
            sb.append(String.format("  %s (%s): %dm\n", row[0], row[1], mins));
        });

        // Focus sessions
        long focusSessions = focusRepo.countCompletedSince(deviceId, from);
        long focusMins = focusRepo.totalFocusMinutesSince(deviceId, from);
        sb.append(String.format("\nFOCUS SESSIONS: %d completed, %d total minutes\n",
            focusSessions, focusMins));

        // Late night usage (after 10 PM)
        sb.append("\nLATE NIGHT USAGE (10PM-6AM):\n");
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            // Check logs after 10 PM
            var nightLogs = activityRepo
                .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
                    deviceId,
                    date.atTime(22, 0),
                    date.plusDays(1).atTime(6, 0)
                );
            if (!nightLogs.isEmpty()) {
                long nightMins = nightLogs.stream()
                    .mapToLong(l -> l.getDurationSeconds() / 60).sum();
                sb.append(String.format("  %s: %dm after 10PM\n",
                    date.getDayOfWeek().toString().substring(0, 3), nightMins));
            }
        }

        return sb.toString();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String[] toStringArray(Object obj) {
        if (obj == null) return new String[0];
        if (obj instanceof List<?> list) {
            return list.stream().map(Object::toString).toArray(String[]::new);
        }
        return new String[0];
    }

    @SuppressWarnings("unchecked")
    private InsightDto toDto(AiInsight a, boolean fresh) {
        String deviceName = deviceRepo.findById(a.getDeviceId())
            .map(d -> d.getName()).orElse("Unknown Device");

        return InsightDto.builder()
            .id(a.getId())
            .deviceId(a.getDeviceId())
            .deviceName(deviceName)
            .weeklySummary(a.getWeeklySummary())
            .riskLevel(a.getRiskLevel())
            .riskTags(a.getRiskTags() != null ? Arrays.asList(a.getRiskTags()) : List.of())
            .positiveTags(a.getPositiveTags() != null ? Arrays.asList(a.getPositiveTags()) : List.of())
            .insights(a.getInsights() != null ? a.getInsights() : List.of())
            .generatedAt(a.getGeneratedAt())
            .fresh(fresh)
            .build();
    }
}
