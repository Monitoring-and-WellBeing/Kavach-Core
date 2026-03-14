package com.kavach.ai;

import com.kavach.ai.dto.StudyBuddyChatRequest;
import com.kavach.ai.dto.StudyBuddyResponse;
import com.kavach.ai.dto.TopicSummaryResponse;
import com.kavach.ai.entity.StudentAiUsage;
import com.kavach.ai.repository.StudentAiUsageRepository;
import com.kavach.ai.service.StudentGeminiService;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai/study-buddy")
@RequiredArgsConstructor
public class StudyBuddyController {

    private final StudentGeminiService studyBuddyService;
    private final StudentAiUsageRepository usageRepository;
    private final UserRepository userRepo;

    /**
     * POST /api/v1/ai/study-buddy/chat
     * Student sends a Math/Science question.
     */
    @PostMapping("/chat")
    public ResponseEntity<StudyBuddyResponse> chat(
            @AuthenticationPrincipal String email,
            @RequestBody StudyBuddyChatRequest req) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudyBuddyResponse response = studyBuddyService.chat(
                user.getId(), req.getMessage(), user.getTenantId());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/ai/study-buddy/usage
     * Student checks how many questions they have left today.
     */
    @GetMapping("/usage")
    public ResponseEntity<Map<String, Object>> getUsage(
            @AuthenticationPrincipal String email) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        int used = usageRepository.countTodayByStudent(user.getId(), startOfDay);
        int remaining = Math.max(0, 10 - used);

        return ResponseEntity.ok(Map.of(
                "used", used,
                "remaining", remaining,
                "limit", 10,
                "limitReached", remaining == 0
        ));
    }

    /**
     * GET /api/v1/ai/study-buddy/topics?studentId={studentId}
     * Parent views topic summary of what their child studied.
     * Returns topic tags only — NOT full conversations.
     */
    @GetMapping("/topics")
    public ResponseEntity<TopicSummaryResponse> getTopics(
            @AuthenticationPrincipal String email,
            @RequestParam UUID studentId) {

        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        List<StudentAiUsage> usages = usageRepository
                .findByStudentIdSince(studentId, since);

        List<String> topics = usages.stream()
                .map(StudentAiUsage::getTopic)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .collect(Collectors.toList());

        return ResponseEntity.ok(TopicSummaryResponse.builder()
                .topics(topics)
                .totalQuestionsThisWeek(usages.size())
                .build());
    }
}
