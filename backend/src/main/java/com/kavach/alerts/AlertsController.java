package com.kavach.alerts;

import com.kavach.alerts.dto.*;
import com.kavach.alerts.service.AlertService;
import com.kavach.users.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertsController {

    private final AlertService alertService;
    private final UserRepository userRepo;

    // ── Rules ─────────────────────────────────────────────────────────────────

    // GET /api/v1/alerts/rules
    @GetMapping("/rules")
    public ResponseEntity<List<AlertRuleDto>> getRules(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(alertService.getRules(getTenantId(email)));
    }

    // POST /api/v1/alerts/rules
    @PostMapping("/rules")
    public ResponseEntity<AlertRuleDto> createRule(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody CreateRuleRequest req) {
        UUID tenantId = getTenantId(email);
        UUID userId   = getUserId(email);
        return ResponseEntity.status(201).body(alertService.createRule(tenantId, userId, req));
    }

    // PATCH /api/v1/alerts/rules/{id}/toggle
    @PatchMapping("/rules/{id}/toggle")
    public ResponseEntity<AlertRuleDto> toggleRule(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        return ResponseEntity.ok(alertService.toggleRule(id, getTenantId(email)));
    }

    // DELETE /api/v1/alerts/rules/{id}
    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        alertService.deleteRule(id, getTenantId(email));
        return ResponseEntity.noContent().build();
    }

    // ── Alerts feed ───────────────────────────────────────────────────────────

    // GET /api/v1/alerts?page=0&size=20
    @GetMapping
    public ResponseEntity<AlertsPageDto> getAlerts(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(alertService.getAlerts(getTenantId(email), page, size));
    }

    // PATCH /api/v1/alerts/{id}/read
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        alertService.markRead(id, getTenantId(email));
        return ResponseEntity.ok().build();
    }

    // POST /api/v1/alerts/read-all
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal String email) {
        alertService.markAllRead(getTenantId(email));
        return ResponseEntity.ok().build();
    }

    // PATCH /api/v1/alerts/{id}/dismiss
    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<Void> dismiss(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        alertService.dismiss(id, getTenantId(email));
        return ResponseEntity.ok().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email)
            .map(u -> u.getTenantId())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UUID getUserId(String email) {
        return userRepo.findByEmail(email)
            .map(u -> u.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
