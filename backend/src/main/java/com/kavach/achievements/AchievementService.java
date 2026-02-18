package com.kavach.achievements;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;

    public List<Achievement> getStudentAchievements(UUID studentId) {
        return achievementRepository.findByStudentIdOrderByEarnedAtDesc(studentId);
    }

    public String getShareLink(UUID achievementId) {
        Achievement achievement = achievementRepository.findById(achievementId)
            .orElseThrow(() -> new RuntimeException("Achievement not found"));
        return "https://kavach.ai/achievements/" + achievementId;
    }
}
