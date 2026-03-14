package com.kavach.gamification.service;

import com.kavach.activity.entity.AppCategory;
import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.focus.entity.FocusSession;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.gamification.entity.Badge;
import com.kavach.gamification.entity.StudentBadge;
import com.kavach.gamification.repository.BadgeRepository;
import com.kavach.gamification.repository.StudentBadgeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeEvaluationService {

    private final BadgeRepository badgeRepo;
    private final StudentBadgeRepository studentBadgeRepo;
    private final ActivityLogRepository activityRepo;
    private final FocusSessionRepository focusRepo;

    /**
     * Evaluate all badges for a device and award any newly earned ones.
     * Call this after: focus session completes, daily sync, or manually.
     * Returns list of newly awarded badge codes.
     */
    @Transactional
    public List<String> evaluateAndAwardBadges(UUID deviceId, UUID tenantId) {
        List<Badge> allBadges = badgeRepo.findByActiveTrue();
        List<String> newlyAwarded = new ArrayList<>();

        for (Badge badge : allBadges) {
            // Skip already earned
            if (studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, badge.getId())) continue;

            boolean earned = evaluateCriteria(badge, deviceId);

            if (earned) {
                StudentBadge sb = StudentBadge.builder()
                    .deviceId(deviceId)
                    .tenantId(tenantId)
                    .badgeId(badge.getId())
                    .build();
                studentBadgeRepo.save(sb);
                newlyAwarded.add(badge.getCode());
                log.info("[badges] Awarded '{}' to device {}", badge.getName(), deviceId);
            }
        }

        return newlyAwarded;
    }

    private boolean evaluateCriteria(Badge badge, UUID deviceId) {
        Map<String, Object> criteria = badge.getCriteria();
        String type = (String) criteria.get("type");
        int threshold = toInt(criteria.get("threshold"));

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime allTime = LocalDateTime.of(2024, 1, 1, 0, 0);

        return switch (type) {

            case "focus_sessions_total" -> {
                long total = focusRepo.countCompletedSince(deviceId, allTime);
                yield total >= threshold;
            }

            case "streak_days" -> {
                int streak = calculateStreak(deviceId);
                yield streak >= threshold;
            }

            case "long_session_minutes" -> {
                // Has completed a single focus session >= threshold minutes
                yield focusRepo.findByDeviceIdOrderByStartedAtDesc(deviceId).stream()
                    .filter(s -> "COMPLETED".equals(s.getStatus()))
                    .anyMatch(s -> s.getDurationMinutes() >= threshold);
            }

            case "gaming_reduction_percent" -> {
                // Gaming time this week vs last week
                LocalDateTime twoWeeksAgo = LocalDateTime.now().minusDays(14);
                long lastWeekGaming = getCategorySeconds(deviceId, AppCategory.GAMING, weekAgo, LocalDateTime.now());
                long prevWeekGaming = getCategorySeconds(deviceId, AppCategory.GAMING, twoWeeksAgo, weekAgo);
                if (prevWeekGaming == 0) yield false;
                double reduction = (prevWeekGaming - lastWeekGaming) * 100.0 / prevWeekGaming;
                yield reduction >= threshold;
            }

            case "healthy_screen_days" -> {
                // Days in last 7 where screen time < 4 hours
                int healthyDays = 0;
                for (int i = 0; i < 7; i++) {
                    LocalDate date = LocalDate.now().minusDays(i);
                    long secs = activityRepo.totalDurationSince(deviceId, date.atStartOfDay());
                    if (secs < 14400) healthyDays++; // < 4 hours
                }
                yield healthyDays >= threshold;
            }

            case "education_hours_day" -> {
                // Today's education >= threshold hours
                long educationSecs = getCategorySeconds(deviceId, AppCategory.EDUCATION,
                    startOfToday, LocalDateTime.now());
                yield (educationSecs / 3600) >= threshold;
            }

            case "early_morning_focus" -> {
                // Any focus session started before 8 AM
                yield focusRepo.findByDeviceIdOrderByStartedAtDesc(deviceId).stream()
                    .filter(s -> "COMPLETED".equals(s.getStatus()))
                    .anyMatch(s -> s.getStartedAt().getHour() < 8);
            }

            case "no_late_night_days" -> {
                // threshold days with zero activity after 10 PM
                int cleanNights = 0;
                for (int i = 0; i < 14; i++) {
                    LocalDate date = LocalDate.now().minusDays(i);
                    var nightLogs = activityRepo
                        .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
                            deviceId, date.atTime(22, 0), date.plusDays(1).atTime(6, 0));
                    if (nightLogs.isEmpty()) cleanNights++;
                    if (cleanNights >= threshold) break;
                }
                yield cleanNights >= threshold;
            }

            case "total_xp" -> {
                long xp = studentBadgeRepo.totalXpByDevice(deviceId);
                yield xp >= threshold;
            }

            default -> {
                log.warn("[badges] Unknown criteria type: {}", type);
                yield false;
            }
        };
    }

    private long getCategorySeconds(UUID deviceId, AppCategory category,
                                     LocalDateTime from, LocalDateTime to) {
        return activityRepo.findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, from, to)
            .stream()
            .filter(l -> category.equals(l.getCategory()))
            .mapToLong(l -> l.getDurationSeconds())
            .sum();
    }

    private int calculateStreak(UUID deviceId) {
        int streak = 0;
        LocalDate date = LocalDate.now();
        while (true) {
            long sessions = focusRepo.countCompletedSince(deviceId, date.atStartOfDay());
            if (sessions == 0 && !date.equals(LocalDate.now())) break;
            if (sessions > 0) streak++;
            date = date.minusDays(1);
            if (streak > 365) break;
        }
        return streak;
    }

    private int toInt(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 0; }
    }
}
