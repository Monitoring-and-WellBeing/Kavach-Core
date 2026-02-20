package com.kavach.dashboard;

import com.kavach.activity.entity.ActivityLog;
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
import java.time.temporal.ChronoUnit;
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

    // GET /api/v1/dashboard/student
    @GetMapping("/student")
    public ResponseEntity<Map<String, Object>> getStudentDashboard(
            @AuthenticationPrincipal String email) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // For student, we need their device
        // Students are linked to a device via the tenant + assignedTo field
        // Find the device assigned to this student
        List<Device> tenantDevices = deviceRepo.findByTenantIdAndActiveTrue(user.getTenantId());
        Device studentDevice = tenantDevices.stream()
                .filter(d -> user.getName() != null &&
                        user.getName().equalsIgnoreCase(d.getAssignedTo()))
                .findFirst()
                .orElse(tenantDevices.isEmpty() ? null : tenantDevices.get(0));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now()
                .with(java.time.DayOfWeek.MONDAY).atStartOfDay();

        if (studentDevice == null) {
            return ResponseEntity.ok(Map.of(
                    "deviceLinked", false,
                    "message", "No device linked to your account yet."
            ));
        }

        UUID deviceId = studentDevice.getId();

        // ── Today's stats ─────────────────────────────────────────────────────────
        long screenSecsToday = activityRepo.totalDurationSince(deviceId, startOfDay);
        long focusMinutesToday = focusRepo.totalFocusMinutesSince(deviceId, startOfDay);
        long focusSessionsToday = focusRepo.countCompletedSince(deviceId, startOfDay);

        // ── Focus score (0-100) ───────────────────────────────────────────────────
        // Score formula:
        //   Base: 50 if any screen time today
        //   +20 if completed at least 1 focus session
        //   +10 per additional focus session (max +20)
        //   +10 if education > 30% of screen time
        //   -20 if gaming > 2 hours
        int focusScore = calculateFocusScore(deviceId, screenSecsToday, focusMinutesToday,
                focusSessionsToday, startOfDay);

        // ── Streak (consecutive days with ≥1 focus session) ──────────────────────
        int streak = calculateStreak(deviceId);

        // ── Top apps today ────────────────────────────────────────────────────────
        var topApps = activityRepo.topAppsSince(deviceId, startOfDay)
                .stream().limit(5)
                .map(row -> Map.of(
                        "appName", row[0],
                        "category", row[1].toString(),
                        "durationSeconds", row[2]
                ))
                .toList();

        // ── Category breakdown today ──────────────────────────────────────────────
        var categories = activityRepo.categoryBreakdown(deviceId, startOfDay)
                .stream()
                .map(row -> Map.of(
                        "category", row[0].toString(),
                        "durationSeconds", row[1]
                ))
                .toList();

        // ── Weekly screen time (7 days) ───────────────────────────────────────────
        List<Map<String, Object>> weeklyData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
            
            // Get logs for this specific day
            long daySecs = activityRepo.findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
                    deviceId, dayStart, dayEnd)
                    .stream()
                    .mapToLong(a -> a.getDurationSeconds())
                    .sum();
            
            weeklyData.add(Map.of(
                    "date", date.toString(),
                    "dayLabel", date.getDayOfWeek().toString().substring(0, 3),
                    "screenTimeSeconds", daySecs
            ));
        }

        // ── Active focus session ──────────────────────────────────────────────────
        var activeFocus = focusRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE")
                .map(s -> Map.of(
                        "sessionId", s.getId().toString(),
                        "title", s.getTitle(),
                        "remainingSeconds",
                        (int) Math.max(ChronoUnit.SECONDS
                                .between(LocalDateTime.now(), s.getEndsAt()), 0)
                ))
                .orElse(null);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("deviceLinked", true);
        response.put("deviceId", deviceId.toString());
        response.put("deviceName", studentDevice.getName());
        response.put("focusScore", focusScore);
        response.put("streak", streak);
        response.put("stats", Map.of(
                "screenTimeSeconds",    screenSecsToday,
                "screenTimeFormatted",  formatSeconds(screenSecsToday),
                "focusMinutesToday",    focusMinutesToday,
                "focusSessionsToday",   focusSessionsToday
        ));
        response.put("topApps", topApps);
        response.put("categories", categories);
        response.put("weeklyData", weeklyData);
        response.put("activeFocusSession", activeFocus);

        return ResponseEntity.ok(response);
    }

    private int calculateFocusScore(UUID deviceId, long screenSecs,
                                    long focusMinutes, long focusSessions,
                                    LocalDateTime startOfDay) {
        if (screenSecs == 0) return 0;
        int score = 50;

        // Focus session bonus
        if (focusSessions >= 1) score += 20;
        score += Math.min((int)(focusSessions - 1) * 10, 20);

        // Education ratio bonus
        long educationSecs = activityRepo.categoryBreakdown(deviceId, startOfDay)
                .stream()
                .filter(row -> "EDUCATION".equals(row[0].toString()))
                .mapToLong(row -> ((Number) row[1]).longValue())
                .sum();
        if (screenSecs > 0 && (educationSecs * 100 / screenSecs) >= 30) score += 10;

        // Gaming penalty
        long gamingSecs = activityRepo.categoryBreakdown(deviceId, startOfDay)
                .stream()
                .filter(row -> "GAMING".equals(row[0].toString()))
                .mapToLong(row -> ((Number) row[1]).longValue())
                .sum();
        if (gamingSecs > 7200) score -= 20; // > 2 hours gaming

        return Math.max(0, Math.min(100, score));
    }

    private int calculateStreak(UUID deviceId) {
        int streak = 0;
        LocalDate date = LocalDate.now();
        while (streak < 365) {
            LocalDateTime dayStart = date.atStartOfDay();
            long sessions = focusRepo.countCompletedSince(deviceId, dayStart);
            // For today, we count if there are any sessions
            // For past days, we need to check if there were sessions on that specific day
            // Since countCompletedSince counts from dayStart onwards, we need to subtract next day's count
            if (!date.equals(LocalDate.now())) {
                LocalDateTime nextDayStart = date.plusDays(1).atStartOfDay();
                long nextDaySessions = focusRepo.countCompletedSince(deviceId, nextDayStart);
                sessions = sessions - nextDaySessions;
            }
            // Check only up to end of that day
            if (sessions == 0 && !date.equals(LocalDate.now())) break;
            if (sessions > 0) streak++;
            date = date.minusDays(1);
        }
        return streak;
    }

    private String formatSeconds(long seconds) {
        if (seconds <= 0) return "0m";
        long h = seconds / 3600, m = (seconds % 3600) / 60;
        if (h > 0 && m > 0) return h + "h " + m + "m";
        if (h > 0) return h + "h";
        return m > 0 ? m + "m" : "< 1m";
    }

    // GET /api/v1/dashboard/institute
    @GetMapping("/institute")
    public ResponseEntity<Map<String, Object>> getInstituteDashboard(
            @AuthenticationPrincipal String email) {

        UUID tenantId = userRepo.findByEmail(email)
            .map(u -> u.getTenantId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Device> devices = deviceRepo.findByTenantIdAndActiveTrue(tenantId);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        // ── Device status counts ──────────────────────────────────────────────────
        long onlineCount  = devices.stream().filter(d -> d.getStatus() == DeviceStatus.ONLINE).count();
        long offlineCount = devices.stream().filter(d -> d.getStatus() == DeviceStatus.OFFLINE).count();
        long pausedCount  = devices.stream().filter(d -> d.getStatus() == DeviceStatus.PAUSED).count();
        long focusCount   = devices.stream()
            .filter(d -> focusRepo.findByDeviceIdAndStatus(d.getId(), "ACTIVE").isPresent()).count();

        // ── Institute-wide screen time ────────────────────────────────────────────
        long totalScreenSecs = devices.stream()
            .mapToLong(d -> activityRepo.totalDurationSince(d.getId(), startOfDay))
            .sum();

        // ── Blocked attempts today ────────────────────────────────────────────────
        long blockedToday = violationRepo.countByTenantIdAndAttemptedAtAfter(tenantId, startOfDay);

        // ── Compliance score ──────────────────────────────────────────────────────
        // Formula: % of active devices that are online or in focus mode
        // High compliance = devices are being actively used + monitored
        int complianceScore = devices.isEmpty() ? 0 :
            (int) ((onlineCount + focusCount) * 100 / devices.size());

        // ── Top apps institute-wide ───────────────────────────────────────────────
        Map<String, Long> appTotals = new HashMap<>();
        Map<String, String> appCategories = new HashMap<>();
        for (Device d : devices) {
            activityRepo.topAppsSince(d.getId(), startOfDay).forEach(row -> {
                String app = (String) row[0];
                long secs = ((Number) row[2]).longValue();
                appTotals.merge(app, secs, Long::sum);
                appCategories.put(app, row[1].toString());
            });
        }

        List<Map<String, Object>> topApps = appTotals.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(8)
            .map(e -> Map.of(
                "appName", (Object) e.getKey(),
                "category", appCategories.getOrDefault(e.getKey(), "OTHER"),
                "durationSeconds", e.getValue()
            ))
            .toList();

        // ── Per-device details ────────────────────────────────────────────────────
        List<Map<String, Object>> deviceDetails = new ArrayList<>();
        for (Device d : devices) {
            long screenSecs = activityRepo.totalDurationSince(d.getId(), startOfDay);
            long blockedCount = violationRepo.countByDeviceIdAndAttemptedAtAfter(d.getId(), startOfDay);
            boolean inFocus = focusRepo.findByDeviceIdAndStatus(d.getId(), "ACTIVE").isPresent();

            String topApp = activityRepo.topAppsSince(d.getId(), startOfDay)
                .stream().findFirst().map(r -> (String) r[0]).orElse(null);

            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("id", d.getId());
            detail.put("name", d.getName());
            detail.put("assignedTo", d.getAssignedTo());
            detail.put("status", d.getStatus().name());
            detail.put("lastSeen", d.getLastSeen());
            detail.put("screenTimeSeconds", screenSecs);
            detail.put("screenTimeFormatted", formatSeconds(screenSecs));
            detail.put("topApp", topApp);
            detail.put("blockedAttempts", blockedCount);
            detail.put("inFocus", inFocus);
            detail.put("osVersion", d.getOsVersion());
            detail.put("agentVersion", d.getAgentVersion());
            deviceDetails.add(detail);
        }

        // ── Unread alerts ─────────────────────────────────────────────────────────
        long unreadAlerts = alertRepo.countByTenantIdAndReadFalseAndDismissedFalse(tenantId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("stats", Map.of(
            "totalDevices",           devices.size(),
            "onlineDevices",          onlineCount,
            "offlineDevices",         offlineCount,
            "pausedDevices",          pausedCount,
            "focusDevices",           focusCount,
            "totalScreenTimeSeconds", totalScreenSecs,
            "totalScreenTimeFormatted", formatSeconds(totalScreenSecs),
            "blockedAttemptsToday",   blockedToday,
            "complianceScore",        complianceScore,
            "unreadAlerts",           unreadAlerts
        ));
        response.put("devices", deviceDetails);
        response.put("topApps", topApps);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/institute/{tenantId}")
    public ResponseEntity<Map<String, Object>> getInstituteDashboard(@PathVariable java.util.UUID tenantId) {
        return ResponseEntity.ok(dashboardService.getInstituteDashboard(tenantId));
    }
}
