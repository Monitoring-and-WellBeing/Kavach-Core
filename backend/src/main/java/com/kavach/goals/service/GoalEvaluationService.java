package com.kavach.goals.service;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.goals.entity.Goal;
import com.kavach.goals.entity.GoalProgress;
import com.kavach.goals.repository.GoalProgressRepository;
import com.kavach.goals.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoalEvaluationService {

    private final GoalRepository goalRepo;
    private final GoalProgressRepository progressRepo;
    private final ActivityLogRepository activityRepo;
    private final FocusSessionRepository focusRepo;

    @Scheduled(fixedDelay = 900000)
    @SchedulerLock(name = "evaluateAllGoals", lockAtLeastFor = "PT10M", lockAtMostFor = "PT20M")
    @Transactional
    public void evaluateAllGoals() {
        List<Goal> activeGoals = goalRepo.findAll().stream()
            .filter(Goal::isActive)
            .toList();
        
        log.debug("[goals] Evaluating {} active goals", activeGoals.size());
        
        for (Goal goal : activeGoals) {
            try {
                evaluateGoal(goal);
            } catch (Exception e) {
                log.warn("[goals] Goal evaluation failed for {}: {}", goal.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void evaluateGoal(Goal goal) {
        LocalDate today = LocalDate.now();
        LocalDate periodDate = "WEEKLY".equals(goal.getPeriod())
            ? today.with(DayOfWeek.MONDAY) : today;
        LocalDateTime from = periodDate.atStartOfDay();

        int current = computeCurrentValue(goal, from);
        boolean met = isMet(goal, current);

        GoalProgress progress = progressRepo
            .findByGoalIdAndPeriodDate(goal.getId(), periodDate)
            .orElse(GoalProgress.builder()
                .goalId(goal.getId())
                .deviceId(goal.getDeviceId())
                .periodDate(periodDate)
                .targetValue(goal.getTargetValue())
                .build());

        progress.setCurrentValue(current);
        progress.setMet(met);
        progress.setEvaluatedAt(LocalDateTime.now());
        progressRepo.save(progress);
    }

    private int computeCurrentValue(Goal goal, LocalDateTime from) {
        return switch (goal.getGoalType()) {

            case "FOCUS_MINUTES" -> (int) focusRepo
                .totalFocusMinutesSince(goal.getDeviceId(), from);

            case "SCREEN_TIME_LIMIT" -> (int) (
                activityRepo.totalDurationSince(goal.getDeviceId(), from) / 60);

            case "EDUCATION_MINUTES" -> {
                List<Object[]> breakdown = activityRepo.categoryBreakdown(goal.getDeviceId(), from);
                yield (int) (breakdown.stream()
                    .filter(r -> "EDUCATION".equalsIgnoreCase(r[0].toString()))
                    .mapToLong(r -> ((Number) r[1]).longValue())
                    .sum() / 60);
            }

            case "GAMING_LIMIT" -> {
                List<Object[]> breakdown = activityRepo.categoryBreakdown(goal.getDeviceId(), from);
                yield (int) (breakdown.stream()
                    .filter(r -> "GAMING".equalsIgnoreCase(r[0].toString()))
                    .mapToLong(r -> ((Number) r[1]).longValue())
                    .sum() / 60);
            }

            case "FOCUS_SESSIONS" -> (int) focusRepo
                .countCompletedSince(goal.getDeviceId(), from);

            case "NO_LATE_NIGHT" -> {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime nightStart;
                // If it's before 10 PM today, check yesterday's 10 PM to today
                // If it's after 10 PM today, check today's 10 PM to now
                if (now.getHour() < 22) {
                    nightStart = LocalDate.now().minusDays(1).atTime(22, 0);
                } else {
                    nightStart = LocalDate.now().atTime(22, 0);
                }
                var logs = activityRepo.findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
                    goal.getDeviceId(), nightStart, now);
                yield logs.isEmpty() ? 0 : 1;
            }

            default -> 0;
        };
    }

    private boolean isMet(Goal goal, int current) {
        return switch (goal.getGoalType()) {
            case "SCREEN_TIME_LIMIT", "GAMING_LIMIT" -> current <= goal.getTargetValue();
            case "NO_LATE_NIGHT"                     -> current == 0;
            default                                  -> current >= goal.getTargetValue();
        };
    }
}
