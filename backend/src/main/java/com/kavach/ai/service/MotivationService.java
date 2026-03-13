package com.kavach.ai.service;

import com.kavach.ai.entity.DailyMotivation;
import com.kavach.ai.entity.MoodCheckin;
import com.kavach.ai.repository.DailyMotivationRepository;
import com.kavach.ai.repository.AiMoodCheckinRepository;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.repository.FocusSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MotivationService {

    @Value("${kavach.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${kavach.ai.gemini.model:gemini-1.5-flash}")
    private String model;

    private final RestTemplate restTemplate;
    private final DailyMotivationRepository motivationRepo;
    private final AiMoodCheckinRepository moodRepo;
    private final FocusSessionRepository focusRepo;
    private final DeviceRepository deviceRepo;

    // ── Get or generate today's motivational message ───────────────────────────

    public String getDailyMotivation(UUID deviceId, UUID tenantId) {
        // Return cached version for today if it exists
        Optional<DailyMotivation> cached = motivationRepo
                .findByDeviceIdAndCacheDate(deviceId, LocalDate.now());
        if (cached.isPresent()) {
            return cached.get().getMessage();
        }

        // Generate fresh
        String message = generateMotivation(deviceId);

        // Cache it
        motivationRepo.findByDeviceIdAndCacheDate(deviceId, LocalDate.now())
                .ifPresentOrElse(
                    existing -> {
                        existing.setMessage(message);
                        motivationRepo.save(existing);
                    },
                    () -> motivationRepo.save(DailyMotivation.builder()
                            .deviceId(deviceId)
                            .tenantId(tenantId)
                            .message(message)
                            .cacheDate(LocalDate.now())
                            .build())
                );

        return message;
    }

    // ── Build context & call Gemini ───────────────────────────────────────────

    private String generateMotivation(UUID deviceId) {
        if (apiKey == null || apiKey.isBlank()) {
            return buildFallbackMessage(deviceId);
        }

        try {
            Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);

            // Streak (count consecutive focus-session days)
            long streak = focusRepo.countCompletedSince(deviceId,
                    Instant.now().minus(30, ChronoUnit.DAYS)
                           .truncatedTo(ChronoUnit.DAYS)
                           .atZone(java.time.ZoneOffset.UTC).toLocalDateTime());

            // Today's focus score (simplified: minutes / 1.5, capped at 100)
            long focusMinutes = focusRepo.totalFocusMinutesSince(deviceId,
                    startOfDay.atZone(java.time.ZoneOffset.UTC).toLocalDateTime());
            int score = (int) Math.min(100, focusMinutes * 100 / 60);

            // Last mood
            Optional<MoodCheckin> lastMood = moodRepo
                    .findTopByStudentIdOrderByCheckedInAtDesc(deviceId); // fallback by deviceId
            String mood = lastMood.map(m -> m.getMood().toString()).orElse("3");
            String moodLabel = lastMood.map(m ->
                    m.getMoodLabel() != null ? m.getMoodLabel() : "okay").orElse("okay");

            // Time of day
            int hour = LocalTime.now().getHour();
            String timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

            String prompt = String.format("""
                Given this student's data:
                - Focus streak: %d days
                - Focus score today: %d/100
                - Last mood: %s (%s)
                - Time: %s

                Write a warm, encouraging message in 1-2 sentences for a school student.
                Be specific to their situation. Use one emoji max. Keep it under 30 words.
                Examples:
                - "5-day streak! You're building real habits 🔥 Keep the momentum going today."
                - "Rough day? That's okay. Even 20 minutes of focus counts. You've got this."
                Respond with only the message text, no quotes.
                """, streak, score, mood, moodLabel, timeOfDay);

            return callGeminiSimple(prompt);
        } catch (Exception e) {
            log.warn("[motivation] Generation failed: {}", e.getMessage());
            return buildFallbackMessage(deviceId);
        }
    }

    private String callGeminiSimple(String prompt) {
        String url = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
            model, apiKey);

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            )),
            "generationConfig", Map.of(
                "maxOutputTokens", 80,
                "temperature", 0.9
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                url, new HttpEntity<>(body, headers), Map.class);
            return extractText(response);
        } catch (Exception e) {
            log.error("[motivation] Gemini call failed: {}", e.getMessage());
            return "Every day is a new chance to do great. You've got this! 💪";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> body) {
        try {
            var candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) return defaultMessage();
            var content  = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) return defaultMessage();
            var parts    = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) return defaultMessage();
            String text = (String) parts.get(0).get("text");
            return text != null ? text.trim() : defaultMessage();
        } catch (Exception e) {
            return defaultMessage();
        }
    }

    private String buildFallbackMessage(UUID deviceId) {
        int hour = LocalTime.now().getHour();
        if (hour < 12) return "Good morning! A great day of learning starts now. 🌅";
        if (hour < 17) return "You're doing great — keep focusing this afternoon! 🎯";
        return "Evening study time! Even 20 minutes makes a difference. 📚";
    }

    private String defaultMessage() {
        return "Every day is a new chance to do great. You've got this! 💪";
    }
}
