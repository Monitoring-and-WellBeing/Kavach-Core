package com.kavach.insights.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${kavach.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${kavach.ai.gemini.model:gemini-1.5-flash}")
    private String model;

    private final Environment environment;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /**
     * Analyze student activity data and return structured insights.
     * Returns mock data if API key is not configured (graceful degradation).
     */
    public Map<String, Object> analyzeStudentActivity(String activitySummary,
                                                        String studentName,
                                                        String deviceName) {
        return analyzeStudentActivity(activitySummary, null, studentName, deviceName);
    }

    /**
     * Analyze student activity + mood data and return structured insights.
     */
    public Map<String, Object> analyzeStudentActivity(String activitySummary,
                                                        String moodSummary,
                                                        String studentName,
                                                        String deviceName) {
        // Production safety check
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isProd = Arrays.stream(activeProfiles).anyMatch(p -> p.equals("prod") || p.equals("production"));
        if (isProd && (apiKey == null || apiKey.isBlank())) {
            throw new IllegalStateException("Gemini API key not configured in production.");
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[insights] GEMINI_API_KEY not set — returning mock insights");
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

        String moodSection = (moodSummary != null && !moodSummary.isBlank())
            ? "\nMOOD DATA:\n" + moodSummary + "\n"
            : "";

        String userPrompt = String.format("""
            Analyze this student's digital week and write a parent report.

            Student: %s
            Device: %s

            USAGE DATA:
            %s
            %s
            Respond with ONLY a valid JSON object in this exact structure:
            {
              "weekly_summary": "Parent report: 1. SUMMARY (2 sentences). 2. WHAT WENT WELL (1-2 specifics). 3. WATCH OUT FOR (1 concern, gentle tone, or skip if none). 4. SUGGESTION (1 actionable tip). Total under 150 words. Warm, factual, supportive tone.",
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
            Not alarmist — this parent loves their child and wants to help, not punish.
            """, studentName, deviceName, activitySummary, moodSection);

        try {
            String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, apiKey
            );

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", systemPrompt + "\n\n" + userPrompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 1000
                )
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

            if (response == null) {
                log.error("[insights] Gemini API returned null response");
                return buildMockInsights(studentName);
            }

            // Extract text from Gemini response
            String text = extractText(response);
            if (text == null || text.isBlank()) {
                log.error("[insights] Gemini API response had no text content");
                return buildMockInsights(studentName);
            }

            // Clean and parse JSON
            String cleanJson = text.trim()
                .replaceAll("^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();

            return objectMapper.readValue(cleanJson, Map.class);

        } catch (Exception e) {
            log.error("[insights] Gemini API call failed: {}", e.getMessage());
            return buildMockInsights(studentName);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> body) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return null;
            }

            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            if (content == null) {
                return null;
            }

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                return null;
            }

            Map<String, Object> textPart = parts.get(0);
            return (String) textPart.get("text");
        } catch (Exception e) {
            log.error("[insights] Failed to extract text from Gemini response: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Object> buildMockInsights(String studentName) {
        return Map.of(
            "weekly_summary",
                "Usage data has been collected this week. Configure your Gemini API key " +
                "to enable AI-powered insights for " + studentName + ".",
            "risk_level", "LOW",
            "risk_tags", List.of(),
            "positive_tags", List.of("data_collected"),
            "insights", List.of(
                Map.of("type", "TIP", "title", "Enable AI Insights",
                    "body", "Add GEMINI_API_KEY to your backend environment to unlock personalized insights.",
                    "icon", "🤖", "priority", 1)
            )
        );
    }
}
