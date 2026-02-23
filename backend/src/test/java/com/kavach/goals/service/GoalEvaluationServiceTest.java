package com.kavach.goals.service;

import com.kavach.activity.entity.ActivityLog;
import com.kavach.activity.entity.AppCategory;
import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.focus.entity.FocusSession;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.goals.entity.Goal;
import com.kavach.goals.entity.GoalProgress;
import com.kavach.goals.repository.GoalProgressRepository;
import com.kavach.goals.repository.GoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 05 — Goal Evaluation Service")
class GoalEvaluationServiceTest {

    @Mock GoalRepository goalRepo;
    @Mock GoalProgressRepository progressRepo;
    @Mock ActivityLogRepository activityRepo;
    @Mock FocusSessionRepository focusRepo;

    @InjectMocks GoalEvaluationService goalEvaluationService;

    private UUID tenantId;
    private UUID deviceId;
    private UUID goalId;
    private Goal mockGoal;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        deviceId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        goalId = UUID.fromString("33333333-3333-3333-3333-333333333333");

        mockGoal = Goal.builder()
            .id(goalId)
            .tenantId(tenantId)
            .deviceId(deviceId)
            .title("Focus Goal")
            .goalType("FOCUS_MINUTES")
            .period("DAILY")
            .targetValue(60)
            .active(true)
            .build();
    }

    @Test
    @DisplayName("FOCUS_MINUTES goal met when focusMinutes >= target")
    void evaluateGoal_focusMinutesGoalMet_whenTargetReached() {
        // Given: Goal requires 60 min focus, device has 75 min
        when(progressRepo.findByGoalIdAndPeriodDate(goalId, any(LocalDate.class)))
            .thenReturn(Optional.empty());
        when(focusRepo.totalFocusMinutesSince(deviceId, any(LocalDateTime.class)))
            .thenReturn(75L);

        // When
        goalEvaluationService.evaluateGoal(mockGoal);

        // Then: Progress should show met=true
        ArgumentCaptor<GoalProgress> progressCaptor = ArgumentCaptor.forClass(GoalProgress.class);
        verify(progressRepo).save(progressCaptor.capture());

        GoalProgress progress = progressCaptor.getValue();
        assertThat(progress.getCurrentValue()).isEqualTo(75);
        assertThat(progress.isMet()).isTrue();
        assertThat(progress.getTargetValue()).isEqualTo(60);
    }

    @Test
    @DisplayName("SCREEN_TIME_LIMIT goal met when screenTime <= target")
    void evaluateGoal_screenTimeLimitMet_whenUnderLimit() {
        // Given: Goal requires screen time <= 120 min, device has 90 min
        mockGoal.setGoalType("SCREEN_TIME_LIMIT");
        mockGoal.setTargetValue(120);

        when(progressRepo.findByGoalIdAndPeriodDate(goalId, any(LocalDate.class)))
            .thenReturn(Optional.empty());
        when(activityRepo.totalDurationSince(deviceId, any(LocalDateTime.class)))
            .thenReturn(5400L); // 90 minutes in seconds

        // When
        goalEvaluationService.evaluateGoal(mockGoal);

        // Then: Progress should show met=true (90 <= 120)
        ArgumentCaptor<GoalProgress> progressCaptor = ArgumentCaptor.forClass(GoalProgress.class);
        verify(progressRepo).save(progressCaptor.capture());

        GoalProgress progress = progressCaptor.getValue();
        assertThat(progress.getCurrentValue()).isEqualTo(90);
        assertThat(progress.isMet()).isTrue();
    }

    @Test
    @DisplayName("GAMING_LIMIT goal NOT met when gaming > target")
    void evaluateGoal_gamingLimitNotMet_whenExceedsTarget() {
        // Given: Goal requires gaming <= 60 min, device has 90 min
        mockGoal.setGoalType("GAMING_LIMIT");
        mockGoal.setTargetValue(60);

        when(progressRepo.findByGoalIdAndPeriodDate(goalId, any(LocalDate.class)))
            .thenReturn(Optional.empty());
        Object[] categoryUsage = new Object[]{"GAMING", 5400L};
        List<Object[]> mockBreakdown = new java.util.ArrayList<>();
        mockBreakdown.add(categoryUsage);
        when(activityRepo.categoryBreakdown(deviceId, any(LocalDateTime.class)))
            .thenReturn(mockBreakdown); // 90 minutes

        // When
        goalEvaluationService.evaluateGoal(mockGoal);

        // Then: Progress should show met=false (90 > 60)
        ArgumentCaptor<GoalProgress> progressCaptor = ArgumentCaptor.forClass(GoalProgress.class);
        verify(progressRepo).save(progressCaptor.capture());

        GoalProgress progress = progressCaptor.getValue();
        assertThat(progress.getCurrentValue()).isEqualTo(90);
        assertThat(progress.isMet()).isFalse();
    }

    @Test
    @DisplayName("NO_LATE_NIGHT goal met when no activity after 22:00")
    void evaluateGoal_noLateNightMet_whenNoActivityAfter22() {
        // Given: Goal requires no activity after 22:00, device has none
        mockGoal.setGoalType("NO_LATE_NIGHT");
        mockGoal.setTargetValue(0);

        when(progressRepo.findByGoalIdAndPeriodDate(goalId, any(LocalDate.class)))
            .thenReturn(Optional.empty());
        when(activityRepo.findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
            eq(deviceId), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(List.of()); // No activity

        // When
        goalEvaluationService.evaluateGoal(mockGoal);

        // Then: Progress should show met=true (current=0)
        ArgumentCaptor<GoalProgress> progressCaptor = ArgumentCaptor.forClass(GoalProgress.class);
        verify(progressRepo).save(progressCaptor.capture());

        GoalProgress progress = progressCaptor.getValue();
        assertThat(progress.getCurrentValue()).isEqualTo(0);
        assertThat(progress.isMet()).isTrue();
    }

    @Test
    @DisplayName("progress upserted correctly (update not duplicate)")
    void evaluateGoal_progressUpserted_notDuplicate() {
        // Given: Existing progress record
        GoalProgress existingProgress = GoalProgress.builder()
            .id(UUID.randomUUID())
            .goalId(goalId)
            .deviceId(deviceId)
            .periodDate(LocalDate.now())
            .currentValue(30)
            .targetValue(60)
            .met(false)
            .build();

        when(progressRepo.findByGoalIdAndPeriodDate(goalId, any(LocalDate.class)))
            .thenReturn(Optional.of(existingProgress));
        when(focusRepo.totalFocusMinutesSince(deviceId, any(LocalDateTime.class)))
            .thenReturn(75L); // Now met

        // When
        goalEvaluationService.evaluateGoal(mockGoal);

        // Then: Existing progress should be updated, not duplicated
        ArgumentCaptor<GoalProgress> progressCaptor = ArgumentCaptor.forClass(GoalProgress.class);
        verify(progressRepo).save(progressCaptor.capture());

        GoalProgress updatedProgress = progressCaptor.getValue();
        assertThat(updatedProgress.getId()).isEqualTo(existingProgress.getId());
        assertThat(updatedProgress.getCurrentValue()).isEqualTo(75);
        assertThat(updatedProgress.isMet()).isTrue();
        verify(progressRepo, never()).save(any(GoalProgress.class)); // Only one save call
    }

    @Test
    @DisplayName("WEEKLY goal uses Monday as period start")
    void evaluateGoal_weeklyGoal_usesMondayAsPeriodStart() {
        // Given: Weekly goal
        mockGoal.setPeriod("WEEKLY");
        mockGoal.setGoalType("FOCUS_MINUTES");
        mockGoal.setTargetValue(300);

        when(progressRepo.findByGoalIdAndPeriodDate(goalId, any(LocalDate.class)))
            .thenReturn(Optional.empty());
        when(focusRepo.totalFocusMinutesSince(deviceId, any(LocalDateTime.class)))
            .thenReturn(350L);

        // When
        goalEvaluationService.evaluateGoal(mockGoal);

        // Then: Should query from Monday of current week
        ArgumentCaptor<LocalDate> dateCaptor = ArgumentCaptor.forClass(LocalDate.class);
        verify(progressRepo).findByGoalIdAndPeriodDate(eq(goalId), dateCaptor.capture());

        LocalDate periodDate = dateCaptor.getValue();
        assertThat(periodDate.getDayOfWeek()).isEqualTo(java.time.DayOfWeek.MONDAY);
    }
}
