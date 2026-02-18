package com.kavach.achievements;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Achievement>> getStudentAchievements(@PathVariable UUID studentId) {
        return ResponseEntity.ok(achievementService.getStudentAchievements(studentId));
    }

    @PostMapping("/{achievementId}/share")
    public ResponseEntity<String> shareAchievement(@PathVariable UUID achievementId) {
        return ResponseEntity.ok(achievementService.getShareLink(achievementId));
    }
}
