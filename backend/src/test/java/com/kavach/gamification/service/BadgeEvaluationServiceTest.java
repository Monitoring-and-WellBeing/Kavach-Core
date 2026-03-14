package com.kavach.gamification.service;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.focus.entity.FocusSession;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.gamification.entity.Badge;
import com.kavach.gamification.entity.StudentBadge;
import com.kavach.gamification.repository.BadgeRepository;
import com.kavach.gamification.repository.StudentBadgeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 07 — Badge Evaluation Service")
class BadgeEvaluationServiceTest {

    @Mock BadgeRepository badgeRepo;
    @Mock StudentBadgeRepository studentBadgeRepo;
    @Mock ActivityLogRepository activityRepo;
    @Mock FocusSessionRepository focusRepo;

    @InjectMocks BadgeEvaluationService badgeEvaluationService;

    private UUID tenantId;
    private UUID deviceId;
    private UUID badgeId;
    private Badge mockBadge;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        deviceId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        badgeId = UUID.fromString("33333333-3333-3333-3333-333333333333");

        mockBadge = Badge.builder()
            .id(badgeId)
            .code("first_focus")
            .name("First Focus")
            .description("Complete your first focus session")
            .icon("🎯")
            .category("FOCUS")
            .tier("BRONZE")
            .xpReward(50)
            .active(true)
            .criteria(Map.of("type", "focus_sessions_total", "threshold", 1))
            .build();
    }

    @Test
    @DisplayName("first_focus badge awarded after 1 completed session")
    void evaluateAndAwardBadges_firstFocus_awardedAfterOneSession() {
        // Given: Badge requires 1 focus session, device has 1 completed
        when(badgeRepo.findByActiveTrue()).thenReturn(List.of(mockBadge));
        when(studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, badgeId)).thenReturn(false);
        when(focusRepo.countCompletedSince(eq(deviceId), any(LocalDateTime.class))).thenReturn(1L);
        when(studentBadgeRepo.save(any(StudentBadge.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        List<String> awarded = badgeEvaluationService.evaluateAndAwardBadges(deviceId, tenantId);

        // Then: Badge should be awarded
        assertThat(awarded).containsExactly("first_focus");

        ArgumentCaptor<StudentBadge> badgeCaptor = ArgumentCaptor.forClass(StudentBadge.class);
        verify(studentBadgeRepo).save(badgeCaptor.capture());

        StudentBadge studentBadge = badgeCaptor.getValue();
        assertThat(studentBadge.getDeviceId()).isEqualTo(deviceId);
        assertThat(studentBadge.getTenantId()).isEqualTo(tenantId);
        assertThat(studentBadge.getBadgeId()).isEqualTo(badgeId);
    }

    @Test
    @DisplayName("badge NOT awarded twice (idempotent)")
    void evaluateAndAwardBadges_alreadyEarned_notAwardedAgain() {
        // Given: Badge already earned
        when(badgeRepo.findByActiveTrue()).thenReturn(List.of(mockBadge));
        when(studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, badgeId)).thenReturn(true);

        // When
        List<String> awarded = badgeEvaluationService.evaluateAndAwardBadges(deviceId, tenantId);

        // Then: Badge should NOT be awarded again
        assertThat(awarded).isEmpty();
        verify(studentBadgeRepo, never()).save(any(StudentBadge.class));
    }

    @Test
    @DisplayName("streak_7 badge NOT awarded for 6-day streak")
    void evaluateAndAwardBadges_streak7_notAwardedFor6Days() {
        // Given: Badge requires 7-day streak, device has 6-day streak
        Badge streakBadge = Badge.builder()
            .id(UUID.randomUUID())
            .code("streak_7")
            .name("7 Day Streak")
            .description("Focus for 7 days in a row")
            .icon("🔥")
            .category("FOCUS")
            .tier("SILVER")
            .xpReward(100)
            .active(true)
            .criteria(Map.of("type", "streak_days", "threshold", 7))
            .build();

        when(badgeRepo.findByActiveTrue()).thenReturn(List.of(streakBadge));
        when(studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, streakBadge.getId()))
            .thenReturn(false);

        // Mock streak calculation: 6 days
        when(focusRepo.countCompletedSince(eq(deviceId), any(LocalDateTime.class)))
            .thenReturn(1L, 1L, 1L, 1L, 1L, 1L, 0L); // 6 days with sessions, then break

        // When
        List<String> awarded = badgeEvaluationService.evaluateAndAwardBadges(deviceId, tenantId);

        // Then: Badge should NOT be awarded (6 < 7)
        assertThat(awarded).isEmpty();
        verify(studentBadgeRepo, never()).save(any(StudentBadge.class));
    }

    @Test
    @DisplayName("streak_7 badge awarded for 7-day streak")
    void evaluateAndAwardBadges_streak7_awardedFor7Days() {
        // Given: Badge requires 7-day streak, device has 7-day streak
        Badge streakBadge = Badge.builder()
            .id(UUID.randomUUID())
            .code("streak_7")
            .name("7 Day Streak")
            .description("Focus for 7 days in a row")
            .icon("🔥")
            .category("FOCUS")
            .tier("SILVER")
            .xpReward(100)
            .active(true)
            .criteria(Map.of("type", "streak_days", "threshold", 7))
            .build();

        when(badgeRepo.findByActiveTrue()).thenReturn(List.of(streakBadge));
        when(studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, streakBadge.getId()))
            .thenReturn(false);

        // Mock streak calculation: 7 days
        when(focusRepo.countCompletedSince(eq(deviceId), any(LocalDateTime.class)))
            .thenReturn(1L, 1L, 1L, 1L, 1L, 1L, 1L, 0L); // 7 days with sessions

        // When
        List<String> awarded = badgeEvaluationService.evaluateAndAwardBadges(deviceId, tenantId);

        // Then: Badge should be awarded
        assertThat(awarded).containsExactly("streak_7");
        verify(studentBadgeRepo).save(any(StudentBadge.class));
    }

    @Test
    @DisplayName("XP accumulates correctly across badges")
    void evaluateAndAwardBadges_multipleBadges_xpAccumulates() {
        // Given: Multiple badges that can be earned
        Badge badge1 = Badge.builder()
            .id(UUID.randomUUID())
            .code("first_focus")
            .name("First Focus")
            .criteria(Map.of("type", "focus_sessions_total", "threshold", 1))
            .xpReward(50)
            .active(true)
            .build();

        Badge badge2 = Badge.builder()
            .id(UUID.randomUUID())
            .code("long_session")
            .name("Long Session")
            .criteria(Map.of("type", "long_session_minutes", "threshold", 60))
            .xpReward(100)
            .active(true)
            .build();

        when(badgeRepo.findByActiveTrue()).thenReturn(List.of(badge1, badge2));
        when(studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, badge1.getId())).thenReturn(false);
        when(studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, badge2.getId())).thenReturn(false);

        // Mock: Both criteria met
        when(focusRepo.countCompletedSince(eq(deviceId), any(LocalDateTime.class))).thenReturn(1L);
        FocusSession longSession = FocusSession.builder()
            .id(UUID.randomUUID())
            .deviceId(deviceId)
            .status("COMPLETED")
            .durationMinutes(90)
            .build();
        when(focusRepo.findByDeviceIdOrderByStartedAtDesc(deviceId))
            .thenReturn(List.of(longSession));

        when(studentBadgeRepo.save(any(StudentBadge.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        List<String> awarded = badgeEvaluationService.evaluateAndAwardBadges(deviceId, tenantId);

        // Then: Both badges should be awarded
        assertThat(awarded).containsExactlyInAnyOrder("first_focus", "long_session");
        verify(studentBadgeRepo, times(2)).save(any(StudentBadge.class));
    }

    @Test
    @DisplayName("badge with unknown criteria type is skipped")
    void evaluateAndAwardBadges_unknownCriteriaType_skipped() {
        // Given: Badge with unknown criteria type
        Badge unknownBadge = Badge.builder()
            .id(UUID.randomUUID())
            .code("unknown")
            .name("Unknown Badge")
            .criteria(Map.of("type", "unknown_type", "threshold", 1))
            .active(true)
            .build();

        when(badgeRepo.findByActiveTrue()).thenReturn(List.of(unknownBadge));
        when(studentBadgeRepo.existsByDeviceIdAndBadgeId(deviceId, unknownBadge.getId()))
            .thenReturn(false);

        // When
        List<String> awarded = badgeEvaluationService.evaluateAndAwardBadges(deviceId, tenantId);

        // Then: Badge should NOT be awarded
        assertThat(awarded).isEmpty();
        verify(studentBadgeRepo, never()).save(any(StudentBadge.class));
    }
}
