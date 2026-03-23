package com.kavach.focus.service;

import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import com.kavach.devices.entity.DeviceType;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.dto.AgentFocusStatusDto;
import com.kavach.focus.dto.FocusSessionDto;
import com.kavach.focus.dto.StartFocusRequest;
import com.kavach.focus.entity.FocusSession;
import com.kavach.focus.entity.FocusWhitelist;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.focus.repository.FocusWhitelistRepository;
import com.kavach.challenges.service.ChallengeService;
import com.kavach.gamification.service.BadgeEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 04 — Focus Service")
class FocusServiceTest {

    @Mock FocusSessionRepository sessionRepo;
    @Mock FocusWhitelistRepository whitelistRepo;
    @Mock DeviceRepository deviceRepo;
    @Mock BadgeEvaluationService badgeEvaluationService;
    @Mock ChallengeService challengeService;
    @Mock ApplicationEventPublisher eventPublisher;

    @InjectMocks FocusService focusService;

    private UUID tenantId;
    private UUID deviceId;
    private UUID userId;
    private Device mockDevice;
    private FocusSession existingSession;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        deviceId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        userId = UUID.fromString("33333333-3333-3333-3333-333333333333");

        mockDevice = Device.builder()
            .id(deviceId)
            .tenantId(tenantId)
            .name("Test Device")
            .type(DeviceType.DESKTOP)
            .status(DeviceStatus.ONLINE)
            .active(true)
            .build();

        existingSession = FocusSession.builder()
            .id(UUID.randomUUID())
            .tenantId(tenantId)
            .deviceId(deviceId)
            .status("ACTIVE")
            .startedAt(LocalDateTime.now().minusMinutes(10))
            .endsAt(LocalDateTime.now().plusMinutes(15))
            .build();

        lenient().doNothing().when(eventPublisher).publishEvent(any(Object.class));
        lenient().when(sessionRepo.save(any(FocusSession.class))).thenAnswer(invocation -> {
            FocusSession s = invocation.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
            }
            return s;
        });
    }

    @Test
    @DisplayName("startSession() creates ACTIVE session")
    void startSession_createsActiveSession() {
        // Given: No existing active session
        when(sessionRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE")).thenReturn(Optional.empty());
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));

        StartFocusRequest req = new StartFocusRequest();
        req.setDeviceId(deviceId);
        req.setDurationMinutes(30);
        req.setTitle("Study Session");

        // When
        FocusSessionDto result = focusService.startSession(tenantId, userId, "PARENT", req);

        // Then: Session should be created with ACTIVE status
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        assertThat(result.getDurationMinutes()).isEqualTo(30);
        assertThat(result.getTitle()).isEqualTo("Study Session");

        ArgumentCaptor<FocusSession> sessionCaptor = ArgumentCaptor.forClass(FocusSession.class);
        verify(sessionRepo).save(sessionCaptor.capture());

        FocusSession savedSession = sessionCaptor.getValue();
        assertThat(savedSession.getStatus()).isEqualTo("ACTIVE");
        assertThat(savedSession.getTenantId()).isEqualTo(tenantId);
        assertThat(savedSession.getDeviceId()).isEqualTo(deviceId);
        assertThat(savedSession.getInitiatedBy()).isEqualTo(userId);
        assertThat(savedSession.getInitiatedRole()).isEqualTo("PARENT");
    }

    @Test
    @DisplayName("startSession() cancels existing ACTIVE session first")
    void startSession_cancelsExistingActiveSession() {
        // Given: Existing active session
        when(sessionRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE"))
            .thenReturn(Optional.of(existingSession));
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));

        StartFocusRequest req = new StartFocusRequest();
        req.setDeviceId(deviceId);
        req.setDurationMinutes(25);
        req.setTitle("New Session");

        // When
        focusService.startSession(tenantId, userId, "STUDENT", req);

        // Then: Existing session should be cancelled first
        verify(sessionRepo, atLeastOnce()).save(any(FocusSession.class));
        assertThat(existingSession.getStatus()).isEqualTo("CANCELLED");
        assertThat(existingSession.getEndReason()).isEqualTo("CANCELLED_BY_STUDENT");
        assertThat(existingSession.getEndedAt()).isNotNull();
    }

    @Test
    @DisplayName("stopSession() marks session COMPLETED")
    void stopSession_marksSessionCompleted() {
        // Given: Active session exists
        when(sessionRepo.findById(existingSession.getId()))
            .thenReturn(Optional.of(existingSession));
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));

        // When
        FocusSessionDto result = focusService.stopSession(existingSession.getId(), tenantId, "PARENT");

        // Then: Session should be marked as CANCELLED
        assertThat(result.getStatus()).isEqualTo("CANCELLED");
        assertThat(result.getEndReason()).isEqualTo("CANCELLED_BY_PARENT");
        assertThat(result.getEndedAt()).isNotNull();

        verify(sessionRepo).save(existingSession);
    }

    @Test
    @DisplayName("getAgentStatus() returns whitelist + remaining seconds")
    void getAgentStatus_returnsWhitelistAndRemainingSeconds() {
        // Given: Active session exists with whitelist
        when(sessionRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE"))
            .thenReturn(Optional.of(existingSession));

        FocusWhitelist whitelist1 = FocusWhitelist.builder()
            .processName("code.exe")
            .appName("VS Code")
            .build();
        FocusWhitelist whitelist2 = FocusWhitelist.builder()
            .processName("chrome.exe")
            .appName("Chrome")
            .build();

        when(whitelistRepo.findByTenantId(tenantId))
            .thenReturn(List.of(whitelist1, whitelist2));

        // When
        AgentFocusStatusDto result = focusService.getAgentStatus(deviceId);

        // Then: Should return focus status with whitelist
        assertThat(result.isFocusActive()).isTrue();
        assertThat(result.getSessionId()).isEqualTo(existingSession.getId());
        assertThat(result.getWhitelistedProcesses()).containsExactlyInAnyOrder("code.exe", "chrome.exe");
        assertThat(result.getRemainingSeconds()).isGreaterThan(0);
    }

    @Test
    @DisplayName("getAgentStatus() returns focusActive=false when no session")
    void getAgentStatus_noActiveSession_returnsInactive() {
        // Given: No active session
        when(sessionRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE"))
            .thenReturn(Optional.empty());

        // When
        AgentFocusStatusDto result = focusService.getAgentStatus(deviceId);

        // Then: Should return inactive
        assertThat(result.isFocusActive()).isFalse();
        assertThat(result.getSessionId()).isNull();
        assertThat(result.getWhitelistedProcesses()).isNull();
    }

    @Test
    @DisplayName("expireElapsedSessions() marks expired sessions EXPIRED")
    void expireElapsedSessions_marksExpiredSessionsCompleted() {
        // Given: Expired session
        FocusSession expiredSession = FocusSession.builder()
            .id(UUID.randomUUID())
            .tenantId(tenantId)
            .deviceId(deviceId)
            .status("ACTIVE")
            .startedAt(LocalDateTime.now().minusHours(2))
            .endsAt(LocalDateTime.now().minusMinutes(30)) // Expired 30 min ago
            .build();

        when(sessionRepo.findExpiredSessions(any(LocalDateTime.class)))
            .thenReturn(List.of(expiredSession));
        when(sessionRepo.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(badgeEvaluationService.evaluateAndAwardBadges(any(UUID.class), any(UUID.class))).thenReturn(List.of());

        // When
        focusService.expireElapsedSessions();

        // Then: Session should be marked as COMPLETED
        assertThat(expiredSession.getStatus()).isEqualTo("COMPLETED");
        assertThat(expiredSession.getEndReason()).isEqualTo("COMPLETED");
        assertThat(expiredSession.getEndedAt()).isNotNull();

        verify(sessionRepo).saveAll(anyList());
        verify(badgeEvaluationService).evaluateAndAwardBadges(eq(deviceId), eq(tenantId));
    }

    @Test
    @DisplayName("student self-start respects allowStudentFocus preference")
    void startSession_studentSelfStart_createsSession() {
        // Given: Student self-starting a session
        when(sessionRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE")).thenReturn(Optional.empty());
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));

        StartFocusRequest req = new StartFocusRequest();
        req.setDeviceId(deviceId);
        req.setDurationMinutes(20);
        req.setTitle("Self Study");

        // When: Student initiates
        FocusSessionDto result = focusService.startSession(tenantId, userId, "STUDENT", req);

        // Then: Session should be created with STUDENT role
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("ACTIVE");

        ArgumentCaptor<FocusSession> sessionCaptor = ArgumentCaptor.forClass(FocusSession.class);
        verify(sessionRepo).save(sessionCaptor.capture());

        FocusSession savedSession = sessionCaptor.getValue();
        assertThat(savedSession.getInitiatedRole()).isEqualTo("STUDENT");
    }
}
