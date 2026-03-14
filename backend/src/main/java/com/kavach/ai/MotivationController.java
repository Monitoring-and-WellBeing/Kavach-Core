package com.kavach.ai;

import com.kavach.ai.dto.RuleSuggestion;
import com.kavach.ai.service.MotivationService;
import com.kavach.ai.service.RuleSuggestionService;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class MotivationController {

    private final MotivationService motivationService;
    private final RuleSuggestionService ruleSuggestionService;
    private final DeviceRepository deviceRepo;
    private final UserRepository userRepo;

    /**
     * GET /api/v1/ai/motivation/{deviceId}
     * Returns today's personalized motivational message.
     * Result is cached per device per day — Gemini called at most once per day.
     */
    @GetMapping("/motivation/{deviceId}")
    public ResponseEntity<Map<String, String>> getMotivation(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String message = motivationService.getDailyMotivation(deviceId, user.getTenantId());
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * GET /api/v1/ai/rule-suggestions
     * Returns AI-generated rule suggestions based on the tenant's usage patterns.
     */
    @GetMapping("/rule-suggestions")
    public ResponseEntity<List<RuleSuggestion>> getRuleSuggestions(
            @AuthenticationPrincipal String email) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<RuleSuggestion> suggestions = ruleSuggestionService
                .getRuleSuggestions(user.getTenantId());

        return ResponseEntity.ok(suggestions);
    }
}
