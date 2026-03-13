package com.kavach.location;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.location.dto.*;
import com.kavach.location.service.LocationService;
import com.kavach.location.service.MobileUsageService;
import com.kavach.users.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * LocationController — GPS tracking + geo-fence management + mobile app-usage.
 *
 * Endpoint auth strategy (mirrors the existing desktop-agent pattern):
 *
 *   Mobile write endpoints  → no JWT required; device authenticates by deviceId
 *     POST /location/update
 *     POST /location/batch
 *     POST /location/geofence-event
 *     POST /activity/mobile-usage
 *     GET  /location/geofences?deviceId=...
 *
 *   Parent dashboard read endpoints → JWT required
 *     GET  /location/current/{deviceId}
 *     GET  /location/history/{deviceId}
 *
 * The no-JWT mobile endpoints are whitelisted in SecurityConfig.
 */
@RestController
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;
    private final MobileUsageService mobileUsageService;
    private final UserRepository userRepo;
    private final DeviceRepository deviceRepo;

    // ── Mobile write endpoints (no JWT) ───────────────────────────────────────

    /** Single GPS fix from the background location task. */
    @PostMapping("/api/v1/location/update")
    public ResponseEntity<Map<String, String>> updateLocation(
            @Valid @RequestBody LocationUpdateRequest req) {
        locationService.saveLocation(req);
        return ResponseEntity.ok(Map.of("status", "saved"));
    }

    /** Bulk GPS fixes flushed from the offline queue. */
    @PostMapping("/api/v1/location/batch")
    public ResponseEntity<Map<String, Object>> batchLocation(
            @Valid @RequestBody LocationBatchRequest req) {
        int saved = locationService.saveBatch(req);
        return ResponseEntity.ok(Map.of("saved", saved, "total", req.getLocations().size()));
    }

    /** Geo-fence enter/exit event from the mobile app. */
    @PostMapping("/api/v1/location/geofence-event")
    public ResponseEntity<Void> geofenceEvent(
            @Valid @RequestBody GeoFenceEventRequest req) {
        locationService.handleFenceEvent(req);
        return ResponseEntity.ok().build();
    }

    /**
     * Active geo-fences for the device's tenant.
     * Called by the mobile app on every open to refresh its monitored regions.
     */
    @GetMapping("/api/v1/location/geofences")
    public ResponseEntity<List<GeoFenceDto>> getGeofences(
            @RequestParam UUID deviceId) {
        return ResponseEntity.ok(locationService.getFencesForDevice(deviceId));
    }

    /** Mobile app-usage stats (30-min windows from UsageStatsManager). */
    @PostMapping("/api/v1/activity/mobile-usage")
    public ResponseEntity<Map<String, Object>> mobileUsage(
            @Valid @RequestBody MobileUsageRequest req) {
        int saved = mobileUsageService.saveUsage(req);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    // ── Parent dashboard read endpoints (JWT required) ────────────────────────

    /** Most recent GPS fix for a device — used by LocationCard polling. */
    @GetMapping("/api/v1/location/current/{deviceId}")
    public ResponseEntity<?> getCurrentLocation(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {
        // Verify the device belongs to this parent's tenant
        assertDeviceOwnership(email, deviceId);
        return locationService.getCurrentLocation(deviceId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** Last 24 h of GPS history for a device. */
    @GetMapping("/api/v1/location/history/{deviceId}")
    public ResponseEntity<List<LocationDto>> getHistory(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {
        assertDeviceOwnership(email, deviceId);
        return ResponseEntity.ok(locationService.getHistory(deviceId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertDeviceOwnership(String email, UUID deviceId) {
        UUID tenantId = userRepo.findByEmail(email)
                .map(u -> u.getTenantId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        deviceRepo.findById(deviceId)
                .filter(d -> tenantId.equals(d.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Device not found or access denied"));
    }
}
