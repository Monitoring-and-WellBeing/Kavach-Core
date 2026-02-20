package com.kavach.gamification.service;

import com.kavach.gamification.dto.BadgeDto;
import com.kavach.gamification.dto.BadgeProgressDto;
import com.kavach.gamification.entity.Badge;
import com.kavach.gamification.entity.StudentBadge;
import com.kavach.gamification.repository.BadgeRepository;
import com.kavach.gamification.repository.StudentBadgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepo;
    private final StudentBadgeRepository studentBadgeRepo;
    private final BadgeEvaluationService evaluationService;

    public BadgeProgressDto getBadgeProgress(UUID deviceId, UUID tenantId) {
        // Run evaluation first
        evaluationService.evaluateAndAwardBadges(deviceId, tenantId);

        List<Badge> allBadges = badgeRepo.findByActiveTrue();
        List<StudentBadge> earned = studentBadgeRepo.findByDeviceIdOrderByEarnedAtDesc(deviceId);

        Set<UUID> earnedIds = earned.stream()
            .map(StudentBadge::getBadgeId).collect(Collectors.toSet());

        Map<UUID, java.time.LocalDateTime> earnedAtMap = earned.stream()
            .collect(Collectors.toMap(StudentBadge::getBadgeId, StudentBadge::getEarnedAt));

        long totalXp = studentBadgeRepo.totalXpByDevice(deviceId);

        // Build badge DTOs
        List<BadgeDto> badges = allBadges.stream()
            .map(b -> BadgeDto.builder()
                .id(b.getId()).code(b.getCode()).name(b.getName())
                .description(b.getDescription()).icon(b.getIcon())
                .category(b.getCategory()).tier(b.getTier())
                .xpReward(b.getXpReward())
                .earned(earnedIds.contains(b.getId()))
                .earnedAt(earnedAtMap.get(b.getId()))
                .build())
            .sorted(Comparator.comparing(BadgeDto::isEarned).reversed()
                .thenComparing(b -> earnedAtMap.getOrDefault(b.getId(), java.time.LocalDateTime.MIN))
                .reversed())
            .toList();

        // Recently earned (last 3)
        List<BadgeDto> recent = badges.stream()
            .filter(BadgeDto::isEarned)
            .sorted(Comparator.comparing(BadgeDto::getEarnedAt,
                Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(3)
            .toList();

        // Category counts
        Map<String, Long> byCategory = badges.stream()
            .filter(BadgeDto::isEarned)
            .collect(Collectors.groupingBy(BadgeDto::getCategory, Collectors.counting()));

        // Level calculation
        String level = getLevel(totalXp);
        int levelProgress = getLevelProgress(totalXp);

        return BadgeProgressDto.builder()
            .totalXp(totalXp)
            .badgesEarned(earned.size())
            .badgesTotal(allBadges.size())
            .level(level)
            .levelProgress(levelProgress)
            .badges(badges)
            .recentlyEarned(recent)
            .byCategory(byCategory)
            .build();
    }

    private String getLevel(long xp) {
        if (xp >= 2000) return "Legend";
        if (xp >= 1000) return "Champion";
        if (xp >= 500)  return "Achiever";
        if (xp >= 200)  return "Explorer";
        return "Beginner";
    }

    private int getLevelProgress(long xp) {
        long[] thresholds = { 0, 200, 500, 1000, 2000 };
        for (int i = thresholds.length - 2; i >= 0; i--) {
            if (xp >= thresholds[i]) {
                long range = thresholds[i + 1] - thresholds[i];
                long progress = xp - thresholds[i];
                return (int) Math.min((progress * 100 / range), 100);
            }
        }
        return 100;
    }
}
