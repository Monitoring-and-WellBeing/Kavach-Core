package com.kavach.dashboard;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.blocking.repository.BlockingViolationRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DeviceRepository deviceRepository;
    private final AlertRepository alertRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final ActivityLogRepository activityLogRepository;
    private final BlockingViolationRepository violationRepository;
    private final UserRepository userRepository;

    // REAL DATA: queries from ActivityLogRepository, FocusSessionRepository
    public Map<String, Object> getStudentDashboard(UUID studentId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Resolve deviceId from studentId
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        List<Device> tenantDevices = deviceRepository.findByTenantIdAndActiveTrue(student.getTenantId());
        Device studentDevice = tenantDevices.stream()
                .filter(d -> student.getName() != null && 
                        student.getName().equalsIgnoreCase(d.getAssignedTo()))
                .findFirst()
                .orElse(tenantDevices.isEmpty() ? null : tenantDevices.get(0));
        
        if (studentDevice == null) {
            dashboard.put("deviceLinked", false);
            dashboard.put("message", "No device linked to your account yet.");
            return dashboard;
        }
        
        UUID deviceId = studentDevice.getId();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        
        // Screen time today (in seconds)
        long screenTimeToday = activityLogRepository.totalDurationSince(deviceId, startOfDay);
        
        // Focus minutes today
        long focusMinutesToday = focusSessionRepository.totalFocusMinutesSince(deviceId, startOfDay);
        
        // Focus sessions today
        long focusSessionsToday = focusSessionRepository.countCompletedSince(deviceId, startOfDay);
        
        // Focus score (using same formula as DashboardController)
        int focusScore = calculateFocusScore(deviceId, screenTimeToday, focusMinutesToday, 
                focusSessionsToday, startOfDay);
        
        // Streak (consecutive days with ≥1 focus session)
        int streak = calculateStreak(deviceId);
        
        // Top apps today (limit 5)
        List<Map<String, Object>> topApps = activityLogRepository.topAppsSince(deviceId, startOfDay)
                .stream()
                .limit(5)
                .map(row -> Map.of(
                        "appName", row[0],
                        "category", row[1].toString(),
                        "durationSeconds", row[2]
                ))
                .toList();
        
        // Category breakdown today
        List<Map<String, Object>> categoryBreakdown = activityLogRepository.categoryBreakdown(deviceId, startOfDay)
                .stream()
                .map(row -> Map.of(
                        "category", row[0].toString(),
                        "durationSeconds", row[1]
                ))
                .toList();
        
        // Weekly data (7 days)
        List<Map<String, Object>> weeklyData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
            
            long daySecs = activityLogRepository
                    .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, dayStart, dayEnd)
                    .stream()
                    .mapToLong(a -> a.getDurationSeconds())
                    .sum();
            
            weeklyData.add(Map.of(
                    "date", date.toString(),
                    "dayLabel", date.getDayOfWeek().toString().substring(0, 3),
                    "screenTimeSeconds", daySecs
            ));
        }
        
        // Active focus session
        Map<String, Object> activeFocusSession = focusSessionRepository
                .findByDeviceIdAndStatus(deviceId, "ACTIVE")
                .map(s -> {
                    Map<String, Object> session = new HashMap<>();
                    session.put("sessionId", s.getId().toString());
                    session.put("title", s.getTitle());
                    session.put("remainingSeconds", 
                            (int) Math.max(ChronoUnit.SECONDS.between(LocalDateTime.now(), s.getEndsAt()), 0));
                    return session;
                })
                .orElse(null);
        
        dashboard.put("deviceLinked", true);
        dashboard.put("deviceId", deviceId.toString());
        dashboard.put("deviceName", studentDevice.getName());
        dashboard.put("focusScore", focusScore);
        dashboard.put("focusedTimeToday", focusMinutesToday);
        dashboard.put("currentStreak", streak);
        dashboard.put("focusSessionsToday", focusSessionsToday);
        dashboard.put("screenTimeToday", screenTimeToday);
        dashboard.put("topApps", topApps);
        dashboard.put("categoryBreakdown", categoryBreakdown);
        dashboard.put("weeklyData", weeklyData);
        dashboard.put("activeFocusSession", activeFocusSession);
        
        return dashboard;
    }
    
    private int calculateFocusScore(UUID deviceId, long screenSecs, long focusMinutes, 
                                    long focusSessions, LocalDateTime startOfDay) {
        if (screenSecs == 0) return 0;
        int score = 50;
        
        // Focus session bonus
        if (focusSessions >= 1) score += 20;
        score += Math.min((int)(focusSessions - 1) * 10, 20);
        
        // Education ratio bonus
        long educationSecs = activityLogRepository.categoryBreakdown(deviceId, startOfDay)
                .stream()
                .filter(row -> "EDUCATION".equals(row[0].toString()))
                .mapToLong(row -> ((Number) row[1]).longValue())
                .sum();
        if (screenSecs > 0 && (educationSecs * 100 / screenSecs) >= 30) score += 10;
        
        // Gaming penalty
        long gamingSecs = activityLogRepository.categoryBreakdown(deviceId, startOfDay)
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
            long sessions = focusSessionRepository.countCompletedSince(deviceId, dayStart);
            // For past days, subtract next day's count to get only that day's sessions
            if (!date.equals(LocalDate.now())) {
                LocalDateTime nextDayStart = date.plusDays(1).atStartOfDay();
                long nextDaySessions = focusSessionRepository.countCompletedSince(deviceId, nextDayStart);
                sessions = sessions - nextDaySessions;
            }
            if (sessions == 0 && !date.equals(LocalDate.now())) break;
            if (sessions > 0) streak++;
            date = date.minusDays(1);
        }
        return streak;
    }

    // REAL DATA: queries from DeviceRepository, ActivityLogRepository, FocusSessionRepository, 
    // BlockingViolationRepository, AlertRepository
    public Map<String, Object> getParentDashboard(UUID parentId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Resolve tenantId from parentId
        User parent = userRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent not found"));
        UUID tenantId = parent.getTenantId();
        
        List<Device> devices = deviceRepository.findByTenantIdAndActiveTrue(tenantId);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        
        // Total screen time across all devices today (in seconds)
        long totalScreenTimeSeconds = devices.stream()
                .mapToLong(d -> activityLogRepository.totalDurationSince(d.getId(), startOfDay))
                .sum();
        
        // Active devices (status = ONLINE)
        long activeDevices = devices.stream()
                .filter(d -> d.getStatus() == DeviceStatus.ONLINE)
                .count();
        
        // Focus sessions today across all devices
        long focusSessionsToday = devices.stream()
                .mapToLong(d -> focusSessionRepository.countCompletedSince(d.getId(), startOfDay))
                .sum();
        
        // Blocked attempts today
        long blockedAttemptsToday = violationRepository.countByTenantIdAndAttemptedAtAfter(tenantId, startOfDay);
        
        // Unread alerts
        long unreadAlerts = alertRepository.countByTenantIdAndReadFalseAndDismissedFalse(tenantId);
        
        // Recent alerts (top 5 unread)
        List<Map<String, Object>> recentAlerts = alertRepository
                .findByTenantIdAndDismissedFalseOrderByTriggeredAtDesc(tenantId, 
                        org.springframework.data.domain.PageRequest.of(0, 5))
                .getContent()
                .stream()
                .filter(a -> !a.isRead())
                .limit(5)
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
        
        // Top apps across all devices (aggregate)
        Map<String, Long> appTotals = new HashMap<>();
        Map<String, String> appCategories = new HashMap<>();
        for (Device d : devices) {
            activityLogRepository.topAppsSince(d.getId(), startOfDay).forEach(row -> {
                String app = (String) row[0];
                long secs = ((Number) row[2]).longValue();
                appTotals.merge(app, secs, Long::sum);
                appCategories.put(app, row[1].toString());
            });
        }
        
        List<Map<String, Object>> topApps = appTotals.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> app = new HashMap<>();
                    app.put("name", e.getKey());
                    app.put("category", appCategories.getOrDefault(e.getKey(), "OTHER"));
                    app.put("minutes", e.getValue() / 60);
                    return app;
                })
                .toList();
        
        // Activity heatmap (24 hours)
        List<Map<String, Object>> activityHeatmap = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            LocalDateTime hourStart = startOfDay.plusHours(hour);
            LocalDateTime hourEnd = hourStart.plusHours(1);
            
            long totalSecs = devices.stream()
                    .mapToLong(d -> {
                        return activityLogRepository
                                .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(d.getId(), hourStart, hourEnd)
                                .stream()
                                .mapToLong(a -> a.getDurationSeconds())
                                .sum();
                    })
                    .sum();
            
            activityHeatmap.add(Map.of(
                    "hour", hour,
                    "value", totalSecs / 60.0 // convert to minutes for display
            ));
        }
        
        // Average screen time (hours)
        double avgScreenTime = devices.isEmpty() ? 0.0 : 
                (totalScreenTimeSeconds / 3600.0) / devices.size();
        
        dashboard.put("totalDevices", devices.size());
        dashboard.put("onlineNow", activeDevices);
        dashboard.put("alertsToday", unreadAlerts);
        dashboard.put("avgScreenTime", Math.round(avgScreenTime * 10.0) / 10.0);
        dashboard.put("totalScreenTimeSeconds", totalScreenTimeSeconds);
        dashboard.put("focusSessionsToday", focusSessionsToday);
        dashboard.put("blockedAttemptsToday", blockedAttemptsToday);
        dashboard.put("topApps", topApps);
        dashboard.put("activityHeatmap", activityHeatmap);
        dashboard.put("recentAlerts", recentAlerts);
        
        return dashboard;
    }

    // REAL DATA: queries from DeviceRepository, ActivityLogRepository, FocusSessionRepository,
    // BlockingViolationRepository, AlertRepository
    public Map<String, Object> getInstituteDashboard(UUID tenantId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        List<Device> devices = deviceRepository.findByTenantIdAndActiveTrue(tenantId);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        
        long totalDevices = devices.size();
        long onlineDevices = devices.stream()
                .filter(d -> d.getStatus() == DeviceStatus.ONLINE)
                .count();
        long focusDevices = devices.stream()
                .filter(d -> focusSessionRepository.findByDeviceIdAndStatus(d.getId(), "ACTIVE").isPresent())
                .count();
        
        // Alerts today (with tenantId filter - fixed in P1-B)
        long alertsToday = alertRepository.countByTenantIdAndTriggeredAtAfter(tenantId, startOfDay);
        
        // Compliance score: % of active devices that are online or in focus mode
        int complianceScore = totalDevices == 0 ? 0 : 
                (int) ((onlineDevices + focusDevices) * 100 / totalDevices);
        
        // Total screen time across all devices
        long totalScreenTimeSeconds = devices.stream()
                .mapToLong(d -> activityLogRepository.totalDurationSince(d.getId(), startOfDay))
                .sum();
        
        // Device status heatmap (48 data points - last 48 hours, 1 per hour)
        // Note: This is a simplified version using current device status
        // In production, you might track status history per hour
        List<Map<String, Object>> deviceStatusHeatmap = new ArrayList<>();
        long activeCount = devices.stream()
                .filter(d -> d.getStatus() == DeviceStatus.ONLINE || 
                        d.getStatus() == DeviceStatus.FOCUS_MODE)
                .count();
        
        for (int i = 47; i >= 0; i--) {
            Map<String, Object> point = new HashMap<>();
            point.put("index", 47 - i);
            point.put("status", activeCount > totalDevices / 2 ? "ONLINE" : "OFFLINE");
            point.put("activeCount", activeCount);
            deviceStatusHeatmap.add(point);
        }
        
        // Category breakdown (aggregate across all devices)
        Map<String, Long> categoryTotals = new HashMap<>();
        for (Device d : devices) {
            activityLogRepository.categoryBreakdown(d.getId(), startOfDay).forEach(row -> {
                String category = row[0].toString();
                long secs = ((Number) row[1]).longValue();
                categoryTotals.merge(category, secs, Long::sum);
            });
        }
        
        long totalCategorySecs = categoryTotals.values().stream().mapToLong(Long::longValue).sum();
        List<Map<String, Object>> categoryBreakdown = categoryTotals.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> {
                    int pct = totalCategorySecs > 0 ? (int) (e.getValue() * 100 / totalCategorySecs) : 0;
                    Map<String, Object> cat = new HashMap<>();
                    cat.put("name", e.getKey());
                    cat.put("value", pct);
                    cat.put("durationSeconds", e.getValue());
                    cat.put("color", getCategoryColor(e.getKey()));
                    return cat;
                })
                .toList();
        
        // Critical alerts (high severity, unread, recent)
        List<Map<String, Object>> criticalAlerts = alertRepository
                .findByTenantIdAndDismissedFalseOrderByTriggeredAtDesc(tenantId,
                        org.springframework.data.domain.PageRequest.of(0, 10))
                .getContent()
                .stream()
                .filter(a -> "HIGH".equals(a.getSeverity()) && !a.isRead())
                .limit(5)
                .map(a -> {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("id", a.getId());
                    alert.put("message", a.getTitle());
                    alert.put("severity", a.getSeverity());
                    alert.put("timestamp", a.getTriggeredAt());
                    return alert;
                })
                .toList();
        
        dashboard.put("totalDevices", totalDevices);
        dashboard.put("onlineNow", onlineDevices);
        dashboard.put("alertsToday", alertsToday);
        dashboard.put("complianceScore", complianceScore);
        dashboard.put("totalScreenTimeSeconds", totalScreenTimeSeconds);
        dashboard.put("totalScreenTimeFormatted", formatSeconds(totalScreenTimeSeconds));
        dashboard.put("deviceStatusHeatmap", deviceStatusHeatmap);
        dashboard.put("categoryBreakdown", categoryBreakdown);
        dashboard.put("criticalAlerts", criticalAlerts);
        
        return dashboard;
    }
    
    private String getCategoryColor(String category) {
        return switch (category.toUpperCase()) {
            case "EDUCATION" -> "#3B82F6";
            case "GAMING" -> "#EF4444";
            case "ENTERTAINMENT" -> "#F59E0B";
            case "SOCIAL_MEDIA" -> "#8B5CF6";
            case "PRODUCTIVITY" -> "#22C55E";
            default -> "#6B7280";
        };
    }
    
    private String formatSeconds(long seconds) {
        if (seconds <= 0) return "0m";
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        if (h > 0 && m > 0) return h + "h " + m + "m";
        if (h > 0) return h + "h";
        return m > 0 ? m + "m" : "< 1m";
    }

}
