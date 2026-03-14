package com.kavach.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.ai.dto.RuleSuggestion;
import com.kavach.devices.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RuleSuggestionService {

    @Value("${kavach.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${kavach.ai.gemini.model:gemini-1.5-flash}")
    private String model;

    private final RestTemplate restTemplate;
    private final ActivityLogRepository activityRepo;
    private final DeviceRepository deviceRepo;
    private final ObjectMapper objectMapper;

    // ── Generate rule suggestions for tenant ───────────────────────────────────

    public List<RuleSuggestion> getRuleSuggestions(UUID tenantId) {
        if (apiKey == null || apiKey.isBlank()) {
            return mockSuggestions();
        }

        try {
            String summary = buildTenantUsageSummary(tenantId);
            return callGeminiForSuggestions(summary);
        } catch (Exception e) {
            log.warn("[rule-suggestions] Failed: {}", e.getMessage());
            return mockSuggestions();
        }
    }

    // ── Build activity summary ─────────────────────────────────────────────────

    private String buildTenantUsageSummary(UUID tenantId) {
        StringBuilder sb = new StringBuilder();
        LocalDateTime since = LocalDateTime.now().minusDays(7);

        // Get all devices for the tenant
        deviceRepo.findByTenantIdAndActiveTrue(tenantId).forEach(device -> {
            sb.append("\nDevice: ").append(device.getName()).append("\n");

            activityRepo.topAppsSince(device.getId(), since)
                    .stream().limit(5).forEach(row -> {
                        long mins = ((Number) row[2]).longValue() / 60;
                        sb.append(String.format("  %s (%s): %dm\n", row[0], row[1], mins));
                    });

            activityRepo.categoryBreakdown(device.getId(), since).forEach(row -> {
                long mins = ((Number) row[1]).longValue() / 60;
                sb.append(String.format("  Category %s: %dm\n", row[0], mins));
            });
        });

        return sb.toString();
    }

    // ── Gemini call ───────────────────────────────────────────────────────────

    private List<RuleSuggestion> callGeminiForSuggestions(String summary) {
        String prompt = String.format("""
            Analyze this student device usage and suggest up to 3 parental control rules.

            USAGE DATA:
            %s

            Respond with ONLY valid JSON array. Each item:
            {
              "id": "suggestion_1",
              "reason": "One sentence explaining the pattern observed.",
              "suggestion": "One sentence recommending what the parent can do.",
              "ruleType": "APP | CATEGORY | SCHEDULE",
              "target": "process_name or CATEGORY_KEY",
              "scheduleStart": "HH:mm or null",
              "scheduleEnd": "HH:mm or null"
            }

            Focus on:
            - Apps used for 2+ hours after 9pm
            - Social media or gaming overuse patterns
            - Late night usage (after 10pm)
            Keep tone friendly — these are parents who want to help, not punish.
            Return [] if no strong patterns are found.
            """, summary);

        String url = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
            model, apiKey);

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
            "generationConfig", Map.of("maxOutputTokens", 600, "temperature", 0.3)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                url, new HttpEntity<>(body, headers), Map.class);

            String text = extractText(response);
            String clean = text.trim()
                    .replaceAll("^```json\\s*", "")
                    .replaceAll("^```\\s*", "")
                    .replaceAll("\\s*```$", "")
                    .trim();

            return objectMapper.readValue(clean, new TypeReference<List<RuleSuggestion>>() {});
        } catch (Exception e) {
            log.error("[rule-suggestions] Parse failed: {}", e.getMessage());
            return mockSuggestions();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> body) {
        try {
            var candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "[]";
            var content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) return "[]";
            var parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) return "[]";
            String text = (String) parts.get(0).get("text");
            return text != null ? text : "[]";
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<RuleSuggestion> mockSuggestions() {
        return List.of(
            RuleSuggestion.builder()
                    .id("suggestion_youtube_night")
                    .reason("YouTube is used for 1-2 hours after 9pm most weekdays.")
                    .suggestion("Consider adding a 9:30pm screen time limit for YouTube.")
                    .ruleType("SCHEDULE")
                    .target("youtube.com")
                    .scheduleStart("21:30")
                    .scheduleEnd("23:59")
                    .build(),
            RuleSuggestion.builder()
                    .id("suggestion_gaming_weekend")
                    .reason("Gaming apps average 3+ hours on weekends.")
                    .suggestion("A 2-hour weekend gaming limit could help balance study time.")
                    .ruleType("CATEGORY")
                    .target("GAMING")
                    .scheduleStart(null)
                    .scheduleEnd(null)
                    .build()
        );
    }
}
