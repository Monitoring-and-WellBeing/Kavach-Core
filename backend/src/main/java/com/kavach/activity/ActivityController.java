package com.kavach.activity;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devices/{deviceId}/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<Void> postLogs(
            @PathVariable UUID deviceId,
            @RequestBody List<ActivityLog> logs
    ) {
        logs.forEach(log -> log.setDeviceId(deviceId));
        activityService.saveLogs(logs);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/daily")
    public ResponseEntity<List<ActivityLog>> getDaily(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(activityService.getDailyLogs(deviceId));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<ActivityLog>> getWeekly(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(activityService.getWeeklyLogs(deviceId));
    }

    @GetMapping("/apps")
    public ResponseEntity<List<Map<String, Object>>> getTopApps(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(activityService.getTopApps(deviceId));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(activityService.getCategoryBreakdown(deviceId));
    }
}
