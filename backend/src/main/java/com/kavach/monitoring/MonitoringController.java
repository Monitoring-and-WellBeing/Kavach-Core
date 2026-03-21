package com.kavach.monitoring;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.enforcement.repository.EnforcementEventRepository;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JWT-protected endpoints for the institute/parent monitoring dashboard.
 * Returns enforcement events enriched with device names for the live log panel.
 */
@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final EnforcementEventRepository eventRepo;
    private final DeviceRepository deviceRepo;
    private final UserRepository userRepo;

    /**
     * GET /api/v1/monitoring/events
     *
     * Returns the most recent enforcement events for the authenticated tenant,
     * optionally filtered by a specific device. Enriches each event with the
     * device's display name for rendering in the live monitor panel.
     *
     * @param deviceId optional — if provided, only events for that device are returned
     * @param limit    max number of events to return (capped at 200)
     */
    @GetMapping("/events")
    public ResponseEntity<List<MonitoringEventResponse>> getEvents(
            @AuthenticationPrincipal String email,
            @RequestParam(required = false) UUID deviceId,
            @RequestParam(defaultValue = "100") int limit
    ) {
        UUID tenantId = userRepo.findByEmail(email)
                .map(u -> u.getTenantId())
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        // Build device-id → name lookup for this tenant (avoids N+1)
        Map<UUID, String> deviceNames = deviceRepo.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .collect(Collectors.toMap(
                        d -> d.getId(),
                        d -> d.getName()
                ));

        int cap = Math.min(limit, 200);
        var pageable = PageRequest.of(0, cap);

        var page = deviceId != null
                ? eventRepo.findByDeviceIdOrderByTimestampDesc(deviceId, pageable)
                : eventRepo.findByTenantIdOrderByTimestampDesc(tenantId, pageable);

        List<MonitoringEventResponse> result = page.stream()
                .map(e -> MonitoringEventResponse.builder()
                        .id(e.getId())
                        .deviceId(e.getDeviceId())
                        .deviceName(deviceNames.getOrDefault(e.getDeviceId(), "Unknown Device"))
                        .processName(e.getProcessName())
                        .action(e.getAction())
                        .detail(e.getDetail())
                        .platform(e.getPlatform())
                        .timestamp(e.getTimestamp())
                        .build())
                .toList();

        return ResponseEntity.ok(result);
    }
}
