package com.kavach.goals.service;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.goals.dto.CreateGoalRequest;
import com.kavach.goals.dto.GoalDto;
import com.kavach.goals.entity.Goal;
import com.kavach.goals.entity.GoalProgress;
import com.kavach.goals.repository.GoalProgressRepository;
import com.kavach.goals.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepo;
    private final GoalProgressRepository progressRepo;
    private final DeviceRepository deviceRepo;
    private final GoalEvaluationService evaluationService;

    public List<GoalDto> getGoalsForDevice(UUID deviceId) {
        List<Goal> goals = goalRepo.findByDeviceIdAndActiveTrue(deviceId);
        goals.forEach(evaluationService::evaluateGoal); // refresh on read
        return goals.stream().map(this::toDto).toList();
    }

    public List<GoalDto> getGoalsForTenant(UUID tenantId) {
        List<Goal> goals = goalRepo.findByTenantIdAndActiveTrue(tenantId);
        goals.forEach(evaluationService::evaluateGoal);
        return goals.stream().map(this::toDto).toList();
    }

    @Transactional
    public GoalDto createGoal(UUID tenantId, UUID userId, CreateGoalRequest req) {
        Goal goal = Goal.builder()
            .tenantId(tenantId)
            .deviceId(req.getDeviceId())
            .createdBy(userId)
            .title(req.getTitle())
            .goalType(req.getGoalType())
            .period(req.getPeriod())
            .targetValue(req.getTargetValue())
            .build();
        goal = goalRepo.save(goal);
        evaluationService.evaluateGoal(goal);
        return toDto(goal);
    }

    @Transactional
    public void deleteGoal(UUID goalId, UUID tenantId) {
        goalRepo.findById(goalId)
            .filter(g -> g.getTenantId().equals(tenantId))
            .ifPresent(g -> {
                g.setActive(false);
                goalRepo.save(g);
            });
    }

    private GoalDto toDto(Goal goal) {
        LocalDate today = LocalDate.now();
        GoalProgress todayP = progressRepo.findByGoalIdAndPeriodDate(goal.getId(), today).orElse(null);
        int current = todayP != null ? todayP.getCurrentValue() : 0;
        boolean met = todayP != null && todayP.isMet();

        // Progress percent
        double pct = goal.getTargetValue() <= 0 ? 0 :
            switch (goal.getGoalType()) {
                case "NO_LATE_NIGHT" -> current == 0 ? 100.0 : 0.0;
                default -> Math.min((current * 100.0) / goal.getTargetValue(), 100);
            };

        // Progress label
        String label = switch (goal.getGoalType()) {
            case "FOCUS_MINUTES", "EDUCATION_MINUTES"      -> current + " / " + goal.getTargetValue() + " min";
            case "SCREEN_TIME_LIMIT", "GAMING_LIMIT"       -> current + " / " + goal.getTargetValue() + " min";
            case "FOCUS_SESSIONS"                          -> current + " / " + goal.getTargetValue() + " sessions";
            case "NO_LATE_NIGHT" -> current == 0 ? "✅ Clean night" : "⚠️ Late night usage";
            default -> current + " / " + goal.getTargetValue();
        };

        // 7-day history
        LocalDate weekAgo = today.minusDays(6);
        List<GoalProgress> history = progressRepo
            .findByGoalIdAndPeriodDateBetweenOrderByPeriodDateAsc(goal.getId(), weekAgo, today);
        Map<LocalDate, GoalProgress> histMap = new HashMap<>();
        history.forEach(p -> histMap.put(p.getPeriodDate(), p));

        List<GoalDto.DayResult> days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            GoalProgress p = histMap.get(d);
            days.add(new GoalDto.DayResult(d,
                d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                p != null ? p.getCurrentValue() : 0, goal.getTargetValue(),
                p != null && p.isMet()));
        }

        String deviceName = deviceRepo.findById(goal.getDeviceId())
            .map(d -> d.getAssignedTo() != null ? d.getAssignedTo() : d.getName())
            .orElse("Unknown");

        return GoalDto.builder()
            .id(goal.getId())
            .deviceId(goal.getDeviceId())
            .deviceName(deviceName)
            .title(goal.getTitle())
            .goalType(goal.getGoalType())
            .period(goal.getPeriod())
            .targetValue(goal.getTargetValue())
            .active(goal.isActive())
            .currentValue(current)
            .progressPercent(Math.round(pct * 10.0) / 10.0)
            .metToday(met)
            .progressLabel(label)
            .history(days)
            .build();
    }
}
