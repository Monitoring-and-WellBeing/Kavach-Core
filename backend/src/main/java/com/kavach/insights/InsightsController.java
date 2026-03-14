package com.kavach.insights;

import com.kavach.users.UserRepository;
import com.kavach.insights.dto.InsightDto;
import com.kavach.insights.service.InsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/insights")
@RequiredArgsConstructor
public class InsightsController {

    private final InsightService insightService;
    private final UserRepository userRepo;

    // GET /api/v1/insights/device/{deviceId}
    // Returns cached or freshly generated insights
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<InsightDto> getInsights(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {
        UUID tenantId = getTenantId(email);
        return ResponseEntity.ok(insightService.getInsights(deviceId, tenantId));
    }

    // POST /api/v1/insights/device/{deviceId}/refresh
    // Forces regeneration even if cache is fresh
    @PostMapping("/device/{deviceId}/refresh")
    public ResponseEntity<InsightDto> refreshInsights(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {
        UUID tenantId = getTenantId(email);
        return ResponseEntity.ok(insightService.refreshInsights(deviceId, tenantId));
    }

    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email)
            .map(u -> u.getTenantId())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
