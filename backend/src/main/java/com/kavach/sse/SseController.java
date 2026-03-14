package com.kavach.sse;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.UUID;

/**
 * SSE endpoints — replaces the planned WebSocket layer.
 *
 * All real-time data flows are server → client only, making SSE the
 * correct and simpler choice over WebSocket.
 *
 * Endpoints:
 *   GET /api/v1/sse/tenant          — parent dashboard (JWT-auth)
 *   GET /api/v1/sse/device/{id}     — desktop agent    (device-auth, no JWT)
 *   GET /api/v1/sse/health          — diagnostic       (public)
 */
@RestController
@RequestMapping("/api/v1/sse")
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseRegistry      sseRegistry;
    private final UserRepository   userRepo;
    private final DeviceRepository deviceRepo;

    // ── Web-app parent dashboard ───────────────────────────────────────────────

    /**
     * Parent dashboard subscribes here after login.
     * Pushed events:
     *   • alert          — new alert fired for any device in tenant
     *   • rules_updated  — blocking/focus rule changed (trigger UI refresh)
     *   • device_status  — device came online/offline
     */
    @GetMapping(value = "/tenant", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter tenantStream(@AuthenticationPrincipal String email) {
        UUID tenantId = userRepo.findByEmail(email)
                .map(u -> u.getTenantId())
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        log.info("[SSE] Tenant stream opened for {}", email);
        return sseRegistry.registerTenant(tenantId);
    }

    // ── Desktop agent ──────────────────────────────────────────────────────────

    /**
     * Desktop agent subscribes here on startup (no JWT — authenticated by deviceId).
     * Pushed events:
     *   • rules_updated  — blocking rules changed → agent re-fetches enforcement state
     *   • focus_start    — focus session started → agent enables focus enforcement
     *   • focus_end      — focus session ended   → agent disables focus enforcement
     */
    @GetMapping(value = "/device/{deviceId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter deviceStream(@PathVariable String deviceId) {
        UUID tenantId = null;
        try {
            tenantId = deviceRepo.findById(UUID.fromString(deviceId))
                    .map(d -> d.getTenantId())
                    .orElse(null);
        } catch (IllegalArgumentException ignored) {
            log.warn("[SSE] Invalid deviceId format: {}", deviceId);
        }
        log.info("[SSE] Device stream opened for {} (tenant: {})", deviceId, tenantId);
        return sseRegistry.registerDevice(deviceId, tenantId);
    }

    // ── Diagnostic ─────────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "tenantConnections", sseRegistry.tenantCount(),
                "deviceConnections", sseRegistry.deviceCount()
        ));
    }
}
