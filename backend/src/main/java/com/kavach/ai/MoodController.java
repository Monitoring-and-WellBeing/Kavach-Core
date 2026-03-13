package com.kavach.ai;

import com.kavach.ai.dto.MoodCheckinRequest;
import com.kavach.ai.dto.MoodCheckinResponse;
import com.kavach.ai.dto.MoodTrendItem;
import com.kavach.ai.service.MoodService;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController("aiMoodController")
@RequestMapping("/api/v1/mood")
@RequiredArgsConstructor
public class MoodController {

    private final MoodService moodService;
    private final UserRepository userRepo;

    /**
     * POST /api/v1/mood/checkin
     * Student submits their daily mood (body contains deviceId). Returns +10 XP.
     */
    @PostMapping("/checkin")
    public ResponseEntity<MoodCheckinResponse> checkin(
            @AuthenticationPrincipal String email,
            @RequestBody MoodCheckinRequest req) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MoodCheckinResponse response = moodService.submitCheckin(
                user.getId(), user.getTenantId(), req);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/mood/history/{deviceId}
     * Parent views their child's 7-day mood trend.
     */
    @GetMapping("/history/{deviceId}")
    public ResponseEntity<List<MoodTrendItem>> getMoodHistory(
            @AuthenticationPrincipal String email,
            @PathVariable UUID deviceId) {

        List<MoodTrendItem> trend = moodService.getMoodHistory(deviceId);
        return ResponseEntity.ok(trend);
    }

}
