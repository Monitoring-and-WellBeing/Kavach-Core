package com.kavach.enforcement;

import com.kavach.blocking.dto.AgentBlockRuleDto;
import com.kavach.blocking.service.BlockingService;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.enforcement.dto.EnforcementStateDto;
import com.kavach.enforcement.dto.TimeLimitStatusDto;
import com.kavach.enforcement.dto.UsageReportDto;
import com.kavach.enforcement.repository.EnforcementStateRepository;
import com.kavach.enforcement.service.TimeLimitService;
import com.kavach.focus.dto.AgentFocusStatusDto;
import com.kavach.focus.service.FocusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Unified enforcement state endpoints — consumed by both the desktop agent
 * (Electron/Windows) and the Android app.
 *
 * All endpoints are permit-all: clients authenticate implicitly via deviceId
 * which is validated against the devices table.
 */
@RestController
@RequestMapping("/api/v1/enforcement")
@RequiredArgsConstructor
@Slf4j
public class EnforcementStateController {

    private final BlockingService              blockingService;
    private final TimeLimitService             timeLimitService;
    private final FocusService                 focusService;
    private final EnforcementStateRepository   enforcementStateRepository;
    private final DeviceRepository             deviceRepository;

    // ── GET /enforcement/state/{deviceId} ─────────────────────────────────────
    /**
     * Returns the complete enforcement state for a device:
     *   • All active blocking rules
     *   • Today's time-limit status (used / remaining per category)
     *   • Focus mode state and whitelist
     *   • Rules version number (for efficient change detection)
     *
     * Clients should cache this response and re-fetch only when the version
     * changes (detected via the lightweight /version endpoint).
     */
    @GetMapping("/state/{deviceId}")
    public EnforcementStateDto getState(@PathVariable UUID deviceId) {
        var device = deviceRepository.findById(deviceId)
            .orElseThrow(() -> new IllegalArgumentException("Device not found: " + deviceId));

        UUID tenantId = device.getTenantId();

        // Active blocking rules for this device
        List<AgentBlockRuleDto> rules =
            blockingService.getAgentRules(tenantId, deviceId);

        // Today's time limit status
        TimeLimitStatusDto timeLimits =
            timeLimitService.getStatus(deviceId, tenantId);

        // Focus mode — get full session for endsAt, and whitelist from agent status
        var activeSession = focusService.getActiveSession(deviceId);
        AgentFocusStatusDto focusStatus = focusService.getAgentStatus(deviceId);

        // Rules version (0 if no state row yet)
        Integer version = enforcementStateRepository.getVersion(deviceId);
        int rulesVersion = version != null ? version : 0;

        log.debug("[enforcement-state] Serving state for device {} — {} rules, version {}",
                  deviceId, rules.size(), rulesVersion);

        return EnforcementStateDto.builder()
            .blockingRules(rules)
            .timeLimitStatus(timeLimits)
            .focusModeActive(activeSession != null)
            .focusEndsAt(activeSession != null ? activeSession.getEndsAt() : null)
            .focusWhitelist(focusStatus.isFocusActive()
                ? focusStatus.getWhitelistedProcesses()
                : List.of())
            .rulesVersion(rulesVersion)
            .build();
    }

    // ── GET /enforcement/version/{deviceId} ───────────────────────────────────
    /**
     * Lightweight version check — clients poll this every 30 s.
     * Only triggers a full state re-fetch when the version number changes,
     * saving bandwidth between polling cycles.
     */
    @GetMapping("/version/{deviceId}")
    public Map<String, Integer> getVersion(@PathVariable UUID deviceId) {
        Integer version = enforcementStateRepository.getVersion(deviceId);
        return Map.of("version", version != null ? version : 0);
    }

    // ── POST /enforcement/usage ───────────────────────────────────────────────
    /**
     * Both the desktop agent and Android app post incremental usage every ~5 min.
     * Time used across both platforms is summed together for limit calculations,
     * so 30 min gaming on PC + 30 min on phone = 60 min counted against the limit.
     */
    @PostMapping("/usage")
    public ResponseEntity<Void> recordUsage(@Valid @RequestBody UsageReportDto dto) {
        var device = deviceRepository.findById(dto.getDeviceId())
            .orElseThrow(() -> new IllegalArgumentException("Device not found: " + dto.getDeviceId()));

        timeLimitService.recordUsage(
            dto.getDeviceId(),
            device.getTenantId(),
            dto.getAppCategory(),
            dto.getPackageName(),
            dto.getDurationSeconds()
        );

        log.debug("[enforcement-usage] {}s of {} ({}) from {} on device {}",
                  dto.getDurationSeconds(), dto.getAppCategory(),
                  dto.getPackageName(), dto.getPlatform(), dto.getDeviceId());

        return ResponseEntity.ok().build();
    }
}
