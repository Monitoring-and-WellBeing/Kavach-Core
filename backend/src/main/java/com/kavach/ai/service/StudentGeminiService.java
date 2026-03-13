package com.kavach.ai.service;

import com.kavach.ai.dto.StudyBuddyResponse;
import com.kavach.ai.entity.StudentAiUsage;
import com.kavach.ai.repository.StudentAiUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentGeminiService {

    @Value("${kavach.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${kavach.ai.gemini.model:gemini-1.5-flash}")
    private String model;

    private final RestTemplate restTemplate;
    private final StudentAiUsageRepository usageRepository;

    private static final int DAILY_LIMIT = 10;

    private static final String SYSTEM_PROMPT = """
        You are KAVACH Study Buddy, a friendly AI tutor for school students in India.

        YOUR SCOPE (strictly follow this):
        - Help ONLY with Math and Science subjects
        - Classes 5 through 12 level content
        - Indian curriculum (CBSE, ICSE, State boards)

        YOUR STYLE:
        - Friendly, encouraging, patient
        - Guide students to the answer — don't just give it
        - Use simple language appropriate for school students
        - Celebrate when they get it right ("Great work! 🎉")
        - Use emojis sparingly but warmly

        STRICT RULES:
        - If asked about anything other than Math or Science, say:
          "I'm your Math and Science buddy! For other subjects, ask your teacher. \
           Now, want to tackle that Science question? 🔬"
        - Never discuss violence, adult content, politics, or anything harmful
        - Never complete homework for students — guide them step by step
        - If a student seems distressed, say: "It sounds like you're having a tough time. \
          Talk to a trusted adult — your parent or teacher can help. 💙"
        - Keep responses under 200 words

        TOPIC TAGGING:
        At the END of every response, on a new line, add:
        [TOPIC: subject/topic] e.g. [TOPIC: Math/Fractions] or [TOPIC: Science/Photosynthesis]
        This line is parsed by the system and not shown to the student.
        """;

    // ── Public API ─────────────────────────────────────────────────────────────

    public StudyBuddyResponse chat(UUID studentId, String message, UUID tenantId) {
        // Check daily limit (count questions from start of today UTC)
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        int todayCount = usageRepository.countTodayByStudent(studentId, startOfDay);

        if (todayCount >= DAILY_LIMIT) {
            return StudyBuddyResponse.builder()
                    .message("You've used your 10 Study Buddy questions for today! 🌟 " +
                             "Come back tomorrow — great job studying! " +
                             "Meanwhile, try solving the last problem on your own.")
                    .limitReached(true)
                    .remainingQuestions(0)
                    .build();
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[study-buddy] No Gemini API key — returning mock response");
            return mockResponse(message, studentId, tenantId, todayCount);
        }

        String response = callGemini(message);
        String topic = extractTopic(response);
        String cleanResponse = removeTopic(response);

        // Persist topic tag only — no raw message stored
        usageRepository.save(StudentAiUsage.builder()
                .studentId(studentId)
                .tenantId(tenantId)
                .topic(topic)
                .questionHash(hashMessage(message))
                .usedAt(Instant.now())
                .build());

        return StudyBuddyResponse.builder()
                .message(cleanResponse)
                .topic(topic)
                .remainingQuestions(DAILY_LIMIT - todayCount - 1)
                .limitReached(false)
                .build();
    }

    // ── Gemini call ────────────────────────────────────────────────────────────

    private String callGemini(String userMessage) {
        String url = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
            model, apiKey);

        Map<String, Object> body = Map.of(
            "system_instruction", Map.of(
                "parts", List.of(Map.of("text", SYSTEM_PROMPT))
            ),
            "contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))
            )),
            "generationConfig", Map.of(
                "maxOutputTokens", 400,
                "temperature", 0.7
            ),
            "safetySettings", List.of(
                Map.of("category", "HARM_CATEGORY_HARASSMENT",         "threshold", "BLOCK_LOW_AND_ABOVE"),
                Map.of("category", "HARM_CATEGORY_SEXUALLY_EXPLICIT",  "threshold", "BLOCK_LOW_AND_ABOVE"),
                Map.of("category", "HARM_CATEGORY_DANGEROUS_CONTENT",  "threshold", "BLOCK_LOW_AND_ABOVE")
            )
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, new HttpEntity<>(body, headers), Map.class);
            return extractText(response.getBody());
        } catch (Exception e) {
            log.error("[study-buddy] Gemini call failed: {}", e.getMessage());
            return "I'm having a little trouble right now. Try again in a moment! 🔄\n[TOPIC: General]";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> body) {
        try {
            var candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) return fallbackText();
            var content  = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) return fallbackText();
            var parts    = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) return fallbackText();
            String text = (String) parts.get(0).get("text");
            return text != null ? text : fallbackText();
        } catch (Exception e) {
            return fallbackText();
        }
    }

    private String fallbackText() {
        return "I'm having a little trouble right now. Try again in a moment! 🔄\n[TOPIC: General]";
    }

    // ── Topic helpers ──────────────────────────────────────────────────────────

    private String extractTopic(String response) {
        Pattern p = Pattern.compile("\\[TOPIC:\\s*([^\\]]+)\\]");
        Matcher m = p.matcher(response);
        return m.find() ? m.group(1).trim() : "General";
    }

    private String removeTopic(String response) {
        return response.replaceAll("\\[TOPIC:\\s*[^\\]]+\\]", "").trim();
    }

    // ── Privacy helper ─────────────────────────────────────────────────────────

    private String hashMessage(String message) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(message.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "unknown";
        }
    }

    // ── Mock response for dev / no-key mode ────────────────────────────────────

    private StudyBuddyResponse mockResponse(String message, UUID studentId,
                                             UUID tenantId, int todayCount) {
        String topic = message.toLowerCase().contains("science") ? "Science/General"
                     : message.toLowerCase().contains("math")    ? "Math/General"
                     : "Math/General";

        usageRepository.save(StudentAiUsage.builder()
                .studentId(studentId)
                .tenantId(tenantId)
                .topic(topic)
                .questionHash(hashMessage(message))
                .usedAt(Instant.now())
                .build());

        return StudyBuddyResponse.builder()
                .message("Great question! 📐 Let's work through this step by step. " +
                         "First, what do you already know about this topic? " +
                         "(Note: AI tutor is in demo mode — add GEMINI_API_KEY to unlock full answers)")
                .topic(topic)
                .remainingQuestions(DAILY_LIMIT - todayCount - 1)
                .limitReached(false)
                .build();
    }
}
