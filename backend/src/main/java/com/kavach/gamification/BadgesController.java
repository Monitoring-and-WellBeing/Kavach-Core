package com.kavach.gamification;

import com.kavach.gamification.dto.BadgeProgressDto;
import com.kavach.gamification.service.BadgeService;
import com.kavach.gamification.service.BadgeEvaluationService;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/badges")
@RequiredArgsConstructor
public class BadgesController {

    private final BadgeService badgeService;
    private final BadgeEvaluationService evaluationService;
    private final UserRepository userRepo;

    // GET /api/v1/badges/device/{deviceId}
    // Returns full badge progress: earned, locked, XP, level
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<BadgeProgressDto> getBadgeProgress(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {
        UUID tenantId = getTenantId(email);
        return ResponseEntity.ok(badgeService.getBadgeProgress(deviceId, tenantId));
    }

    // POST /api/v1/badges/device/{deviceId}/evaluate
    // Force evaluate — useful for testing
    @PostMapping("/device/{deviceId}/evaluate")
    public ResponseEntity<List<String>> evaluate(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {
        UUID tenantId = getTenantId(email);
        List<String> awarded = evaluationService.evaluateAndAwardBadges(deviceId, tenantId);
        return ResponseEntity.ok(awarded);
    }

    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email)
            .map(User::getTenantId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
