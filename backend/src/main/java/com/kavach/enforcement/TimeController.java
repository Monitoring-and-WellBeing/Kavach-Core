package com.kavach.enforcement;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Provides the current server time to desktop agents.
 *
 * Used by TimeSync.ts to compute a local→server clock offset so that
 * enforcement schedule windows are checked against real server time,
 * not the student's (potentially manipulated) system clock.
 *
 * Endpoint: GET /api/v1/health/time
 * Returns:  { "timestamp": "2024-01-15T09:00:00.123Z" }
 * Auth:     permitAll — agents call this before they are linked
 */
@RestController
@RequestMapping("/api/v1/health")
public class TimeController {

    @GetMapping("/time")
    public ResponseEntity<Map<String, String>> getServerTime() {
        return ResponseEntity.ok(Map.of("timestamp", Instant.now().toString()));
    }
}
