package com.kavach.focus;

import com.kavach.users.User;
import com.kavach.users.UserRepository;
import com.kavach.focus.dto.*;
import com.kavach.focus.service.FocusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/focus")
@RequiredArgsConstructor
public class FocusController {

    private final FocusService focusService;
    private final UserRepository userRepo;

    // ── Parent/Admin: start focus on a device ──────────────────────────────────
    // POST /api/v1/focus/start
    @PostMapping("/start")
    public ResponseEntity<FocusSessionDto> startSession(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody StartFocusRequest req) {
        var user = getUser(email);
        return ResponseEntity.status(201).body(
            focusService.startSession(user.getTenantId(), user.getId(),
                user.getRole().name(), req));
    }

    // ── Student self-start ────────────────────────────────────────────────────
    // POST /api/v1/focus/self-start
    @PostMapping("/self-start")
    public ResponseEntity<FocusSessionDto> selfStart(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody StartFocusRequest req) {
        var user = getUser(email);
        return ResponseEntity.status(201).body(
            focusService.startSession(user.getTenantId(), user.getId(), "STUDENT", req));
    }

    // ── Stop a session ────────────────────────────────────────────────────────
    // POST /api/v1/focus/{sessionId}/stop
    @PostMapping("/{sessionId}/stop")
    public ResponseEntity<FocusSessionDto> stopSession(
            @AuthenticationPrincipal String email,
            @PathVariable UUID sessionId) {
        var user = getUser(email);
        return ResponseEntity.ok(
            focusService.stopSession(sessionId, user.getTenantId(),
                user.getRole().name()));
    }

    // ── Get active session for device ─────────────────────────────────────────
    // GET /api/v1/focus/device/{deviceId}/active
    @GetMapping("/device/{deviceId}/active")
    public ResponseEntity<FocusSessionDto> getActive(@PathVariable UUID deviceId) {
        FocusSessionDto session = focusService.getActiveSession(deviceId);
        return session != null
            ? ResponseEntity.ok(session)
            : ResponseEntity.noContent().build();
    }

    // ── Session history for device ───────────────────────────────────────────
    // GET /api/v1/focus/device/{deviceId}/history
    @GetMapping("/device/{deviceId}/history")
    public ResponseEntity<List<FocusSessionDto>> getHistory(
            @PathVariable UUID deviceId) {
        return ResponseEntity.ok(focusService.getSessionHistory(deviceId));
    }

    // ── Agent polling endpoint — no auth ─────────────────────────────────────
    // GET /api/v1/focus/agent/{deviceId}/status
    @GetMapping("/agent/{deviceId}/status")
    public ResponseEntity<AgentFocusStatusDto> getAgentStatus(
            @PathVariable UUID deviceId) {
        return ResponseEntity.ok(focusService.getAgentStatus(deviceId));
    }

    // ── Agent: mark session completed ─────────────────────────────────────────
    // POST /api/v1/focus/agent/{sessionId}/complete — no auth
    @PostMapping("/agent/{sessionId}/complete")
    public ResponseEntity<Void> agentComplete(@PathVariable UUID sessionId) {
        // Agent calls this when timer hits 0 on device side
        // Backend scheduler also handles expiry — this is belt-and-suspenders
        return ResponseEntity.ok().build();
    }

    // ── Whitelist management ──────────────────────────────────────────────────
    @GetMapping("/whitelist")
    public ResponseEntity<List<String>> getWhitelist(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(focusService.getWhitelist(getTenantId(email)));
    }

    @PostMapping("/whitelist")
    public ResponseEntity<Void> addWhitelist(
            @AuthenticationPrincipal String email,
            @RequestBody Map<String, String> body) {
        focusService.addToWhitelist(getTenantId(email),
            body.get("processName"), body.get("appName"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/whitelist/{processName}")
    public ResponseEntity<Void> removeWhitelist(
            @AuthenticationPrincipal String email,
            @PathVariable String processName) {
        focusService.removeFromWhitelist(getTenantId(email), processName);
        return ResponseEntity.ok().build();
    }

    // ── Today's focus stats (for student dashboard) ───────────────────────────
    @GetMapping("/device/{deviceId}/stats/today")
    public ResponseEntity<Map<String, Object>> getTodayStats(
            @PathVariable UUID deviceId) {
        return ResponseEntity.ok(Map.of(
            "focusMinutesToday",  focusService.getTodayFocusMinutes(deviceId),
            "sessionsToday",      focusService.getTodaySessionCount(deviceId)
        ));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private User getUser(String email) {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UUID getTenantId(String email) {
        return getUser(email).getTenantId();
    }
}
