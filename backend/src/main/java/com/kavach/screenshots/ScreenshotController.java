package com.kavach.screenshots;

import com.kavach.screenshots.dto.ScreenshotDto;
import com.kavach.screenshots.dto.ScreenshotSettingsDto;
import com.kavach.screenshots.service.ScreenshotService;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Screenshot endpoints:
 * <ul>
 *   <li>POST  /upload           — desktop agent uploads raw JPEG bytes</li>
 *   <li>GET   /device/{id}      — parent views day's screenshots</li>
 *   <li>GET   /{id}/url         — parent gets 1-hour pre-signed URL</li>
 *   <li>DELETE /{id}            — parent deletes a screenshot</li>
 *   <li>GET   /settings/{deviceId}   — agent fetches capture settings</li>
 *   <li>PUT   /settings         — parent updates capture settings</li>
 *   <li>POST  /settings/{deviceId}/mark-notified — agent marks student notified</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/screenshots")
@RequiredArgsConstructor
public class ScreenshotController {

    private final ScreenshotService screenshotService;
    private final UserRepository userRepo;

    // ── Desktop agent → upload ─────────────────────────────────────────────

    /**
     * Accepts raw JPEG bytes in the request body.
     * No JWT required — device is identified by deviceId param.
     */
    @PostMapping(value = "/upload", consumes = "image/jpeg")
    public ResponseEntity<ScreenshotDto> upload(
            @RequestParam UUID deviceId,
            @RequestParam String trigger,
            @RequestParam(required = false) String ruleId,
            @RequestParam(required = false) String appName,
            @RequestBody byte[] imageBytes
    ) {
        ScreenshotDto dto = screenshotService.save(deviceId, trigger, ruleId, appName, imageBytes);
        return ResponseEntity.status(201).body(dto);
    }

    // ── Desktop agent → fetch capture settings ─────────────────────────────

    /**
     * Called on agent startup — returns the tenant's screenshot settings
     * so the agent knows whether/how to capture.
     * No JWT required (agent uses deviceId only).
     */
    @GetMapping("/settings/{deviceId}")
    public ResponseEntity<ScreenshotSettingsDto> getAgentSettings(
            @PathVariable UUID deviceId
    ) {
        return ResponseEntity.ok(screenshotService.getSettings(deviceId));
    }

    /**
     * Called after student dismisses the disclosure dialog.
     * No JWT required.
     */
    @PostMapping("/settings/{deviceId}/mark-notified")
    public ResponseEntity<Void> markNotified(@PathVariable UUID deviceId) {
        screenshotService.markStudentNotified(deviceId);
        return ResponseEntity.ok().build();
    }

    // ── Parent dashboard ───────────────────────────────────────────────────

    /**
     * List screenshots for a device on a given date (default: today).
     */
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<ScreenshotDto>> getScreenshots(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(
                screenshotService.getForDevice(deviceId, targetDate, getTenantId(email))
        );
    }

    /** Return a 1-hour pre-signed URL for viewing a screenshot. */
    @GetMapping("/{id}/url")
    public ResponseEntity<Map<String, String>> getUrl(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id
    ) {
        String url = screenshotService.getSignedUrl(id, getTenantId(email));
        return ResponseEntity.ok(Map.of("url", url));
    }

    /** Delete a specific screenshot (parent or admin only). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id
    ) {
        screenshotService.delete(id, getTenantId(email));
        return ResponseEntity.noContent().build();
    }

    /** Get the screenshot settings for the current tenant (parent settings UI). */
    @GetMapping("/settings")
    public ResponseEntity<ScreenshotSettingsDto> getSettings(
            @AuthenticationPrincipal String email
    ) {
        // Re-use getSettings by passing any device — but we need tenantId here
        // Simpler: derive tenantId directly and use a dedicated path
        UUID tenantId = getTenantId(email);
        return ResponseEntity.ok(screenshotService.getSettingsForTenant(tenantId));
    }

    /** Update screenshot settings (parent settings UI). */
    @PutMapping("/settings")
    public ResponseEntity<ScreenshotSettingsDto> updateSettings(
            @AuthenticationPrincipal String email,
            @RequestBody ScreenshotSettingsDto dto
    ) {
        return ResponseEntity.ok(screenshotService.updateSettings(getTenantId(email), dto));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email)
                .map(u -> u.getTenantId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
