package com.kavach.dashboard;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.users.UserRepository;
import com.kavach.blocking.repository.BlockingViolationRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.repository.FocusSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final DeviceRepository deviceRepo;
    private final ActivityLogRepository activityRepo;
    private final AlertRepository alertRepo;
    private final BlockingViolationRepository violationRepo;
    private final FocusSessionRepository focusRepo;
    private final UserRepository userRepo;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentDashboard(@PathVariable java.util.UUID studentId) {
        return ResponseEntity.ok(dashboardService.getStudentDashboard(studentId));
    }

    @GetMapping("/parent/{parentId}")
    public ResponseEntity<Map<String, Object>> getParentDashboard(@PathVariable java.util.UUID parentId) {
        return ResponseEntity.ok(dashboardService.getParentDashboard(parentId));
    }

    // GET /api/v1/dashboard/parent
    // New endpoint using AuthenticationPrincipal for live data
    @GetMapping("/parent")
    public ResponseEntity<Map<String, Object>> getParentDashboardLive(
            @AuthenticationPrincipal String email) {

        UUID tenantId = userRepo.findByEmail(email)
            .map(u -> u.getTenantId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Device> devices = deviceRepo.findByTenantIdAndActiveTrue(tenantId);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        // ── Stat cards ────────────────────────────────────────────────────────
        // Total screen time across all devices today
        long totalScreenSecs = devices.stream()
            .mapToLong(d -> activityRepo.totalDurationSince(d.getId(), startOfDay))
            .sum();

        // Active devices right now
        long activeDevices = devices.stream()
            .filter(d -> d.getStatus() == DeviceStatus.ONLINE).count();

        // Focus sessions today
        long focusSessions = devices.stream()
            .mapToLong(d -> focusRepo.countCompletedSince(d.getId(), startOfDay))
            .sum();

        // Blocked attempts today
        long blockedAttempts = violationRepo
            .countByTenantIdAndAttemptedAtAfter(tenantId, startOfDay);

        // ── Per-device summary ────────────────────────────────────────────────
        List<Map<String, Object>> deviceSummaries = new ArrayList<>();
        for (Device d : devices) {
            long screenSecs = activityRepo.totalDurationSince(d.getId(), startOfDay);

            // Top app today
            String topApp = activityRepo.topAppsSince(d.getId(), startOfDay)
                .stream().findFirst()
                .map(row -> (String) row[0])
                .orElse(null);

            // Active focus session
            boolean inFocus = focusRepo
                .findByDeviceIdAndStatus(d.getId(), "ACTIVE")
                .isPresent();

            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("id", d.getId());
            summary.put("name", d.getName());
            summary.put("assignedTo", d.getAssignedTo());
            summary.put("status", d.getStatus().name());
            summary.put("lastSeen", d.getLastSeen());
            summary.put("screenTimeSeconds", screenSecs);
            summary.put("screenTimeFormatted", formatSeconds(screenSecs));
            summary.put("topApp", topApp);
            summary.put("inFocus", inFocus);
            summary.put("agentVersion", d.getAgentVersion());

            deviceSummaries.add(summary);
        }

        // ── Recent unread alerts ──────────────────────────────────────────────
        var recentAlerts = alertRepo
            .findByTenantIdAndDismissedFalseOrderByTriggeredAtDesc(
                tenantId,
                PageRequest.of(0, 5)
            )
            .getContent()
            .stream()
            .map(a -> {
                Map<String, Object> alert = new LinkedHashMap<>();
                alert.put("id", a.getId());
                alert.put("title", a.getTitle());
                alert.put("severity", a.getSeverity());
                alert.put("ruleType", a.getRuleType());
                alert.put("read", a.isRead());
                alert.put("triggeredAt", a.getTriggeredAt());
                return alert;
            })
            .toList();

        // ── Unread count ──────────────────────────────────────────────────────
        long unreadAlerts = alertRepo
            .countByTenantIdAndReadFalseAndDismissedFalse(tenantId);

        // ── Assemble response ─────────────────────────────────────────────────
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("stats", Map.of(
            "totalScreenTimeSeconds",   totalScreenSecs,
            "totalScreenTimeFormatted", formatSeconds(totalScreenSecs),
            "activeDevices",            activeDevices,
            "totalDevices",             devices.size(),
            "focusSessionsToday",       focusSessions,
            "blockedAttemptsToday",     blockedAttempts,
            "unreadAlerts",             unreadAlerts
        ));
        response.put("devices", deviceSummaries);
        response.put("recentAlerts", recentAlerts);

        return ResponseEntity.ok(response);
    }

    private String formatSeconds(long seconds) {
        if (seconds <= 0) return "0m";
        long h = seconds / 3600, m = (seconds % 3600) / 60;
        if (h > 0 && m > 0) return h + "h " + m + "m";
        if (h > 0) return h + "h";
        return m > 0 ? m + "m" : "< 1m";
    }

    @GetMapping("/institute/{tenantId}")
    public ResponseEntity<Map<String, Object>> getInstituteDashboard(@PathVariable java.util.UUID tenantId) {
        return ResponseEntity.ok(dashboardService.getInstituteDashboard(tenantId));
    }
}
