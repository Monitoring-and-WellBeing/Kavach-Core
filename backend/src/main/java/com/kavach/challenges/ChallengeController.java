package com.kavach.challenges;

import com.kavach.challenges.dto.DailyChallengeDto;
import com.kavach.challenges.dto.StreakDto;
import com.kavach.challenges.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    /** GET /api/v1/challenges/today/{deviceId} — today's 3 challenges + progress */
    @GetMapping("/today/{deviceId}")
    public ResponseEntity<List<DailyChallengeDto>> getTodayChallenges(
            @PathVariable UUID deviceId) {
        return ResponseEntity.ok(challengeService.getTodayChallenges(deviceId));
    }

    /** GET /api/v1/challenges/streak/{deviceId} — current streak + recovery tokens */
    @GetMapping("/streak/{deviceId}")
    public ResponseEntity<StreakDto> getStreak(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(challengeService.getStreakInfo(deviceId));
    }

    /** POST /api/v1/challenges/streak/recover — use recovery token */
    @PostMapping("/streak/recover")
    public ResponseEntity<StreakDto> useRecoveryToken(
            @RequestBody Map<String, String> body) {
        UUID deviceId = UUID.fromString(body.get("deviceId"));
        return ResponseEntity.ok(challengeService.useRecoveryToken(deviceId));
    }
}
