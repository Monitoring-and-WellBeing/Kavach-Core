package com.kavach.insights.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClaudeApiService {

    @Value("${anthropic.api.key:}")
    private String apiKey;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .build();

    private static final String CLAUDE_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-haiku-4-5-20251001";

    /**
     * Analyze student activity data and return structured insights.
     * Returns null if API key is not configured (graceful degradation).
     */
    public Map<String, Object> analyzeStudentActivity(String activitySummary,
                                                        String studentName,
                                                        String deviceName) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[insights] ANTHROPIC_API_KEY not set — returning mock insights");
            return buildMockInsights(studentName);
        }

        String systemPrompt = """
            You are an educational AI assistant for KAVACH AI, a student monitoring platform
            used by Indian schools and parents. You analyze student device usage patterns and
            provide constructive, actionable insights for parents.

            Your tone is:
            - Supportive and non-judgmental toward students
            - Practical and specific for parents
            - Focused on improvement, not punishment
            - Aware of Indian academic context (boards, competitive exams, study patterns)

            Always respond in valid JSON only. No markdown, no explanation outside the JSON.
            """;

        String userPrompt = String.format("""
            Analyze this student's device usage data for the past 7 days and provide insights.

            Student: %s
            Device: %s

            USAGE DATA:
            %s

            Respond with ONLY a valid JSON object in this exact structure:
            {
              "weekly_summary": "2-3 sentence summary of the week's usage pattern",
              "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
              "risk_tags": ["tag1", "tag2"],
              "positive_tags": ["tag1", "tag2"],
              "insights": [
                {
                  "type": "SPIKE | POSITIVE | WARNING | TIP",
                  "title": "Short title",
                  "body": "1-2 sentence explanation",
                  "icon": "emoji",
                  "priority": 1
                }
              ]
            }

            Risk tags options: late_night_usage, excessive_gaming, social_media_overuse,
              low_productivity, declining_focus, screen_time_spike, blocked_app_attempts

            Positive tags options: study_streak, focus_sessions_completed, education_dominant,
              improving_pattern, healthy_screen_time, consistent_schedule

            Generate 3-5 insight cards total. Mix positive and constructive feedback.
            Prioritize the most important insight as priority 1.
            """, studentName, deviceName, activitySummary);

        try {
            Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "max_tokens", 1000,
                "system", systemPrompt,
                "messages", List.of(Map.of("role", "user", "content", userPrompt))
            );

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(CLAUDE_URL))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(30))
                .build();

            HttpResponse<String> response = httpClient.send(request,
                HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("[insights] Claude API error {}: {}", response.statusCode(), response.body());
                return buildMockInsights(studentName);
            }

            // Extract text from response
            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            List<Map<String, Object>> content = (List<Map<String, Object>>) responseMap.get("content");
            String text = (String) content.get(0).get("text");

            // Clean and parse JSON
            String cleanJson = text.trim()
                .replaceAll("^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();

            return objectMapper.readValue(cleanJson, Map.class);

        } catch (Exception e) {
            log.error("[insights] Claude API call failed: {}", e.getMessage());
            return buildMockInsights(studentName);
        }
    }

    private Map<String, Object> buildMockInsights(String studentName) {
        return Map.of(
            "weekly_summary",
                "Usage data has been collected this week. Configure your Anthropic API key " +
                "to enable AI-powered insights for " + studentName + ".",
            "risk_level", "LOW",
            "risk_tags", List.of(),
            "positive_tags", List.of("data_collected"),
            "insights", List.of(
                Map.of("type", "TIP", "title", "Enable AI Insights",
                    "body", "Add ANTHROPIC_API_KEY to your backend environment to unlock personalized insights.",
                    "icon", "🤖", "priority", 1)
            )
        );
    }
}
