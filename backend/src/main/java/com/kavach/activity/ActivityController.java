package com.kavach.activity;

import com.kavach.activity.dto.SyncActivityRequest;
import com.kavach.activity.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    // ── POST /api/v1/activity
    // Called by desktop agent every 30 seconds
    // No JWT auth — device authenticates by deviceId which we validate exists
    @PostMapping
    public ResponseEntity<Map<String, Object>> syncActivity(
            @Valid @RequestBody SyncActivityRequest req) {
        int saved = activityService.syncLogs(req);
        return ResponseEntity.ok(Map.of(
            "saved", saved,
            "total", req.getLogs().size()
        ));
    }

    // ── GET /api/v1/activity/device/{deviceId}/today
    // Quick screen time for today — used by devices page
    @GetMapping("/device/{deviceId}/today")
    public ResponseEntity<Map<String, Object>> getTodaySummary(@PathVariable UUID deviceId) {
        long seconds = activityService.getScreenTimeToday(deviceId);
        var topApps = activityService.getTopAppsToday(deviceId);

        return ResponseEntity.ok(Map.of(
            "screenTimeSeconds", seconds,
            "screenTimeFormatted", formatSeconds(seconds),
            "topApps", topApps.stream().limit(5).map(row -> Map.of(
                "appName", row[0],
                "category", row[1].toString(),
                "durationSeconds", row[2]
            )).toList()
        ));
    }

    private String formatSeconds(long seconds) {
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        if (h > 0) return h + "h " + m + "m";
        return m + "m";
    }
}
