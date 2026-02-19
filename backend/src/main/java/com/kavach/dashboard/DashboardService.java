package com.kavach.dashboard;

import com.kavach.alerts.AlertRepository;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.FocusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DeviceRepository deviceRepository;
    private final AlertRepository alertRepository;
    private final FocusRepository focusRepository;

    public Map<String, Object> getStudentDashboard(UUID studentId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Mock stats - replace with actual queries
        dashboard.put("focusScore", 78);
        dashboard.put("focusedTimeToday", 204); // minutes
        dashboard.put("taskCompletion", 62.5);
        dashboard.put("currentStreak", 12);
        dashboard.put("weeklyData", getWeeklyData());
        dashboard.put("subjectBreakdown", getSubjectBreakdown());
        dashboard.put("tasks", getTodayTasks());
        
        return dashboard;
    }

    public Map<String, Object> getParentDashboard(UUID parentId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        dashboard.put("totalDevices", 5);
        dashboard.put("onlineNow", 3);
        dashboard.put("alertsToday", 4);
        dashboard.put("avgScreenTime", 3.2);
        dashboard.put("topApps", getTopApps());
        dashboard.put("activityHeatmap", getActivityHeatmap());
        dashboard.put("aiSummary", getAISummary());
        
        return dashboard;
    }

    public Map<String, Object> getInstituteDashboard(UUID tenantId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        long totalDevices = deviceRepository.countByTenantId(tenantId);
        long onlineDevices = deviceRepository.countByTenantIdAndStatus(tenantId, "ONLINE") +
                            deviceRepository.countByTenantIdAndStatus(tenantId, "FOCUS_MODE");
        long alertsToday = alertRepository.countByTimestampAfter(
            Instant.now().minus(1, ChronoUnit.DAYS)
        );
        
        dashboard.put("totalDevices", totalDevices);
        dashboard.put("onlineNow", onlineDevices);
        dashboard.put("alertsToday", alertsToday);
        dashboard.put("complianceScore", 78);
        dashboard.put("deviceStatusHeatmap", getDeviceStatusHeatmap(tenantId));
        dashboard.put("categoryBreakdown", getCategoryBreakdown(tenantId));
        dashboard.put("criticalAlerts", getCriticalAlerts(tenantId));
        
        return dashboard;
    }

    private List<Map<String, Object>> getWeeklyData() {
        return Arrays.asList(
            Map.of("day", "Mon", "hours", 3.2),
            Map.of("day", "Tue", "hours", 4.1),
            Map.of("day", "Wed", "hours", 2.8),
            Map.of("day", "Thu", "hours", 4.8),
            Map.of("day", "Fri", "hours", 4.3),
            Map.of("day", "Sat", "hours", 6.1),
            Map.of("day", "Sun", "hours", 5.8)
        );
    }

    private List<Map<String, Object>> getSubjectBreakdown() {
        return Arrays.asList(
            Map.of("name", "Math", "hours", 8.5, "color", "#3B82F6", "pct", 90),
            Map.of("name", "Science", "hours", 6.2, "color", "#22C55E", "pct", 72),
            Map.of("name", "English", "hours", 4.8, "color", "#F59E0B", "pct", 55),
            Map.of("name", "Coding", "hours", 5.5, "color", "#8B5CF6", "pct", 65)
        );
    }

    private List<Map<String, Object>> getTodayTasks() {
        return Arrays.asList(
            Map.of("id", 1, "label", "Complete Math Chapter 5", "time", "10:00 AM", "done", true),
            Map.of("id", 2, "label", "Science Lab Report", "time", "2:00 PM", "done", true),
            Map.of("id", 3, "label", "English Essay Draft", "time", "4:00 PM", "done", false),
            Map.of("id", 4, "label", "Coding Practice — Arrays", "time", "6:00 PM", "done", false)
        );
    }

    private List<Map<String, Object>> getTopApps() {
        return Arrays.asList(
            Map.of("name", "YouTube", "minutes", 45, "color", "#EF4444"),
            Map.of("name", "Instagram", "minutes", 30, "color", "#E4405F"),
            Map.of("name", "WhatsApp", "minutes", 25, "color", "#25D366")
        );
    }

    private List<Map<String, Object>> getActivityHeatmap() {
        List<Map<String, Object>> heatmap = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            heatmap.add(Map.of("hour", i, "value", Math.random() * 100));
        }
        return heatmap;
    }

    private Map<String, Object> getAISummary() {
        return Map.of(
            "title", "Weekly Summary",
            "description", "Screen time reduced by 15% this week. Great progress!",
            "highlight", "Focus sessions increased by 40%",
            "riskLevel", "LOW"
        );
    }

    private List<Map<String, Object>> getDeviceStatusHeatmap(UUID tenantId) {
        List<Map<String, Object>> heatmap = new ArrayList<>();
        for (int i = 0; i < 48; i++) {
            String[] statuses = {"ONLINE", "ONLINE", "ONLINE", "FOCUS_MODE", "OFFLINE", "PAUSED"};
            heatmap.add(Map.of("index", i, "status", statuses[i % statuses.length]));
        }
        return heatmap;
    }

    private List<Map<String, Object>> getCategoryBreakdown(UUID tenantId) {
        return Arrays.asList(
            Map.of("name", "Education", "value", 35, "color", "#3B82F6"),
            Map.of("name", "Gaming", "value", 22, "color", "#EF4444"),
            Map.of("name", "Entertainment", "value", 18, "color", "#F59E0B"),
            Map.of("name", "Social Media", "value", 14, "color", "#8B5CF6"),
            Map.of("name", "Productivity", "value", 8, "color", "#22C55E"),
            Map.of("name", "Other", "value", 3, "color", "#6B7280")
        );
    }

    private List<Map<String, Object>> getCriticalAlerts(UUID tenantId) {
        return Arrays.asList(
            Map.of("id", UUID.randomUUID(), "message", "High usage detected", "severity", "HIGH", "timestamp", Instant.now()),
            Map.of("id", UUID.randomUUID(), "message", "Late night activity", "severity", "HIGH", "timestamp", Instant.now().minus(2, ChronoUnit.HOURS))
        );
    }
}
