package com.kavach.devices;

import com.kavach.devices.dto.*;
import com.kavach.devices.service.DeviceService;
import com.kavach.users.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;
    private final UserRepository userRepo;

    // ── POST /api/v1/devices/generate-code
    // Called by desktop agent before linking — no auth required
    @PostMapping("/generate-code")
    public ResponseEntity<GenerateCodeResponse> generateCode() {
        return ResponseEntity.ok(deviceService.generateCode());
    }

    // ── POST /api/v1/devices/link
    // Called by web dashboard when parent enters the code
    @PostMapping("/link")
    public ResponseEntity<DeviceDto> linkDevice(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody LinkDeviceRequest req) {
        UUID tenantId = getTenantId(email);
        return ResponseEntity.status(201).body(deviceService.linkDevice(tenantId, req));
    }

    // ── GET /api/v1/devices
    // List all devices for the authenticated user's tenant
    @GetMapping
    public ResponseEntity<List<DeviceDto>> listDevices(@AuthenticationPrincipal String email) {
        UUID tenantId = getTenantId(email);
        return ResponseEntity.ok(deviceService.getDevicesByTenant(tenantId));
    }

    // ── GET /api/v1/devices/{id}
    @GetMapping("/{id}")
    public ResponseEntity<DeviceDto> getDevice(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        UUID tenantId = getTenantId(email);
        return ResponseEntity.ok(deviceService.getDevice(id, tenantId));
    }

    // ── PUT /api/v1/devices/{id}
    @PutMapping("/{id}")
    public ResponseEntity<DeviceDto> updateDevice(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id,
            @RequestBody UpdateDeviceRequest req) {
        UUID tenantId = getTenantId(email);
        return ResponseEntity.ok(deviceService.updateDevice(id, tenantId, req));
    }

    // ── POST /api/v1/devices/{id}/pause
    @PostMapping("/{id}/pause")
    public ResponseEntity<DeviceDto> pause(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.pauseDevice(id, getTenantId(email)));
    }

    // ── POST /api/v1/devices/{id}/resume
    @PostMapping("/{id}/resume")
    public ResponseEntity<DeviceDto> resume(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.resumeDevice(id, getTenantId(email)));
    }

    // ── DELETE /api/v1/devices/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        deviceService.removeDevice(id, getTenantId(email));
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/v1/devices/{id}/heartbeat
    // Called every 30s by desktop agent to signal it's alive
    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Void> heartbeat(
            @PathVariable UUID id,
            @RequestBody(required = false) HeartbeatRequest req) {
        deviceService.heartbeat(id,
            req != null ? req.getAgentVersion() : null,
            req != null ? req.getOsVersion() : null,
            req != null ? req.getHostname() : null);
        return ResponseEntity.ok().build();
    }

    // ── GET /api/v1/devices/check-linked?code=KV3X9A
    // Called by desktop agent to poll if someone linked it via web
    @GetMapping("/check-linked")
    public ResponseEntity<Map<String, Object>> checkLinked(@RequestParam String code) {
        return deviceService.checkLinked(code)
                .map(c -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("linked", c.isUsed() && c.getDevice() != null);
                    if (c.isUsed() && c.getDevice() != null) {
                        result.put("deviceId", c.getDevice().getId());
                        result.put("tenantId", c.getTenantId());
                    }
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.ok(Map.of("linked", false)));
    }

    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email)
                .map(u -> u.getTenantId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
