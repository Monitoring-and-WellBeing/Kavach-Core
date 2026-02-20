package com.kavach.blocking;

import com.kavach.users.UserRepository;
import com.kavach.blocking.dto.*;
import com.kavach.blocking.service.BlockingService;
import com.kavach.devices.repository.DeviceRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/blocking")
@RequiredArgsConstructor
public class BlockingController {

    private final BlockingService blockingService;
    private final UserRepository userRepo;
    private final DeviceRepository deviceRepo;

    // ── Web dashboard endpoints (JWT auth required) ───────────────────────────

    // GET /api/v1/blocking/rules
    @GetMapping("/rules")
    public ResponseEntity<List<BlockRuleDto>> getRules(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(blockingService.getRules(getTenantId(email)));
    }

    // POST /api/v1/blocking/rules
    @PostMapping("/rules")
    public ResponseEntity<BlockRuleDto> createRule(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody CreateBlockRuleRequest req) {
        return ResponseEntity.status(201)
                .body(blockingService.createRule(getTenantId(email), getUserId(email), req));
    }

    // PATCH /api/v1/blocking/rules/{id}/toggle
    @PatchMapping("/rules/{id}/toggle")
    public ResponseEntity<BlockRuleDto> toggleRule(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        return ResponseEntity.ok(blockingService.toggleRule(id, getTenantId(email)));
    }

    // DELETE /api/v1/blocking/rules/{id}
    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        blockingService.deleteRule(id, getTenantId(email));
        return ResponseEntity.noContent().build();
    }

    // ── Desktop agent endpoints (no JWT — device auth by deviceId) ────────────

    // GET /api/v1/blocking/rules/{deviceId}/agent
    // Called by desktop agent every 60s to refresh its local rule cache
    @GetMapping("/rules/{deviceId}/agent")
    public ResponseEntity<List<AgentBlockRuleDto>> getAgentRules(@PathVariable UUID deviceId) {
        UUID tenantId = deviceRepo.findById(deviceId)
                .map(d -> d.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Device not found"));
        return ResponseEntity.ok(blockingService.getAgentRules(tenantId, deviceId));
    }

    // POST /api/v1/blocking/violations
    // Called by desktop agent every time it blocks an app
    @PostMapping("/violations")
    public ResponseEntity<Void> logViolation(@Valid @RequestBody ViolationRequest req) {
        blockingService.logViolation(req);
        return ResponseEntity.ok().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email).map(u -> u.getTenantId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UUID getUserId(String email) {
        return userRepo.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
