package com.kavach.mood;

import com.kavach.mood.dto.MoodCheckinDto;
import com.kavach.mood.dto.MoodCheckinRequest;
import com.kavach.mood.dto.MoodTrendDto;
import com.kavach.mood.service.MoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mood")
@RequiredArgsConstructor
public class MoodController {

    private final MoodService moodService;

    /** POST /api/v1/mood/checkin/{deviceId} — submit today's mood */
    @PostMapping("/checkin/{deviceId}")
    public ResponseEntity<MoodCheckinDto> submitMood(
            @PathVariable UUID deviceId,
            @RequestBody MoodCheckinRequest req) {
        return ResponseEntity.ok(moodService.submitMood(deviceId, req));
    }

    /** GET /api/v1/mood/today/{deviceId} — get today's mood check-in */
    @GetMapping("/today/{deviceId}")
    public ResponseEntity<?> getTodayMood(@PathVariable UUID deviceId) {
        return moodService.getTodayMood(deviceId)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.ok(Map.of("checked", false)));
    }

    /** GET /api/v1/mood/trend/{deviceId} — 7-day trend (parent view) */
    @GetMapping("/trend/{deviceId}")
    public ResponseEntity<MoodTrendDto> getMoodTrend(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(moodService.getMoodTrend(deviceId));
    }
}
