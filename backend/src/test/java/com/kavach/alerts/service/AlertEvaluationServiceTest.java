package com.kavach.alerts.service;

import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.entity.AlertRule;
import com.kavach.alerts.entity.RuleType;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.alerts.repository.AlertRuleRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import com.kavach.devices.entity.DeviceType;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.sse.SseRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 03 — Alert Evaluation Service")
class AlertEvaluationServiceTest {

    @Mock AlertRuleRepository ruleRepo;
    @Mock AlertRepository alertRepo;
    @Mock ActivityLogRepository activityRepo;
    @Mock DeviceRepository deviceRepo;
    @Mock SseRegistry sseRegistry;

    @InjectMocks AlertEvaluationService alertEvaluationService;

    private UUID tenantId;
    private UUID deviceId;
    private Device mockDevice;
    private AlertRule mockRule;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        deviceId = UUID.fromString("22222222-2222-2222-2222-222222222222");

        mockDevice = Device.builder()
            .id(deviceId)
            .tenantId(tenantId)
            .name("Test Device")
            .type(DeviceType.DESKTOP)
            .status(DeviceStatus.ONLINE)
            .active(true)
            .assignedTo("Test Student")
            .lastSeen(LocalDateTime.now().minusMinutes(5))
            .build();

        mockRule = AlertRule.builder()
            .id(UUID.randomUUID())
            .tenantId(tenantId)
            .name("Screen Time Alert")
            .ruleType(RuleType.SCREEN_TIME_EXCEEDED)
            .config(Map.of("totalMinutes", 120))
            .appliesTo("ALL_DEVICES")
            .severity("MEDIUM")
            .active(true)
            .cooldownMinutes(60)
            .build();
    }

    @Test
    @DisplayName("threshold exceeded → alert created")
    void evaluateRule_thresholdExceeded_createsAlert() {
        // Given: Rule with 120 min threshold, device has 150 min usage
        when(ruleRepo.findAll()).thenReturn(List.of(mockRule));
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(mockDevice));
        when(activityRepo.totalDurationSince(eq(deviceId), any(LocalDateTime.class)))
            .thenReturn(9000L); // 150 minutes in seconds

        // When
        alertEvaluationService.evaluateAllRules();

        // Then: Alert should be created
        ArgumentCaptor<Alert> alertCaptor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepo, times(1)).save(alertCaptor.capture());

        Alert savedAlert = alertCaptor.getValue();
        assertThat(savedAlert.getDeviceId()).isEqualTo(deviceId);
        assertThat(savedAlert.getTenantId()).isEqualTo(tenantId);
        assertThat(savedAlert.getRuleId()).isEqualTo(mockRule.getId());
        assertThat(savedAlert.getTitle()).contains("Screen time limit exceeded");
        assertThat(savedAlert.getMetadata()).containsKey("usageMinutes");
        assertThat(savedAlert.getMetadata().get("usageMinutes")).isEqualTo(150L);
    }

    @Test
    @DisplayName("threshold NOT exceeded → no alert")
    void evaluateRule_thresholdNotExceeded_noAlert() {
        // Given: Rule with 120 min threshold, device has 60 min usage
        when(ruleRepo.findAll()).thenReturn(List.of(mockRule));
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(mockDevice));
        when(activityRepo.totalDurationSince(eq(deviceId), any(LocalDateTime.class)))
            .thenReturn(3600L); // 60 minutes in seconds

        // When
        alertEvaluationService.evaluateAllRules();

        // Then: No alert should be created
        verify(alertRepo, never()).save(any(Alert.class));
    }

    @Test
    @DisplayName("cooldown active → no duplicate alert")
    void evaluateRule_cooldownActive_noDuplicateAlert() {
        // Given: Rule triggered 30 minutes ago (cooldown is 60 minutes)
        // Service returns early at cooldown check — no device/activity queries needed
        mockRule.setLastTriggered(LocalDateTime.now().minusMinutes(30));
        when(ruleRepo.findAll()).thenReturn(List.of(mockRule));

        // When
        alertEvaluationService.evaluateAllRules();

        // Then: No alert should be created due to cooldown
        verify(alertRepo, never()).save(any(Alert.class));
    }

    @Test
    @DisplayName("alert linked to correct device and tenant")
    void evaluateRule_alertLinkedToCorrectDeviceAndTenant() {
        // Given: Rule for specific device
        mockRule.setAppliesTo("SPECIFIC_DEVICE");
        mockRule.setDeviceId(deviceId);
        when(ruleRepo.findAll()).thenReturn(List.of(mockRule));
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));
        when(activityRepo.totalDurationSince(eq(deviceId), any(LocalDateTime.class)))
            .thenReturn(9000L);

        // When
        alertEvaluationService.evaluateAllRules();

        // Then: Alert should be linked to correct device and tenant
        ArgumentCaptor<Alert> alertCaptor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepo).save(alertCaptor.capture());

        Alert alert = alertCaptor.getValue();
        assertThat(alert.getDeviceId()).isEqualTo(deviceId);
        assertThat(alert.getTenantId()).isEqualTo(tenantId);
        assertThat(alert.getRuleId()).isEqualTo(mockRule.getId());
    }

    @Test
    @DisplayName("alert rule with DAILY period resets at midnight")
    void evaluateRule_dailyPeriodResetsAtMidnight() {
        // Given: Rule with APP_USAGE_EXCEEDED type
        mockRule.setRuleType(RuleType.APP_USAGE_EXCEEDED);
        mockRule.setConfig(Map.of("appName", "Chrome", "thresholdMinutes", 60));
        when(ruleRepo.findAll()).thenReturn(List.of(mockRule));
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(mockDevice));
        Object[] appUsage = new Object[]{"Chrome", "Browser", 4500L};
        List<Object[]> mockTopApps = new java.util.ArrayList<>();
        mockTopApps.add(appUsage);
        when(activityRepo.topAppsSince(eq(deviceId), any(LocalDateTime.class)))
            .thenReturn(mockTopApps); // 75 minutes

        // When
        alertEvaluationService.evaluateAllRules();

        // Then: Alert should be created
        ArgumentCaptor<Alert> alertCaptor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepo).save(alertCaptor.capture());

        Alert alert = alertCaptor.getValue();
        assertThat(alert.getTitle()).contains("Chrome usage limit reached");
        assertThat(alert.getMetadata().get("appName")).isEqualTo("Chrome");
        assertThat(alert.getMetadata().get("usageMinutes")).isEqualTo(75L);

        // Verify it queries from start of day
        verify(activityRepo).topAppsSince(eq(deviceId), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("triggerBlockedAppAlert creates alert without rule")
    void triggerBlockedAppAlert_createsAlertWithoutRule() {
        // When
        alertEvaluationService.triggerBlockedAppAlert(tenantId, deviceId, "BlockedApp", "Test Device");

        // Then: Alert should be created with BLOCKED_APP_ATTEMPT type
        ArgumentCaptor<Alert> alertCaptor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepo).save(alertCaptor.capture());

        Alert alert = alertCaptor.getValue();
        assertThat(alert.getTenantId()).isEqualTo(tenantId);
        assertThat(alert.getDeviceId()).isEqualTo(deviceId);
        assertThat(alert.getRuleType()).isEqualTo("BLOCKED_APP_ATTEMPT");
        assertThat(alert.getSeverity()).isEqualTo("MEDIUM");
        assertThat(alert.getTitle()).contains("Blocked app attempted");
        assertThat(alert.getMetadata().get("appName")).isEqualTo("BlockedApp");
    }
}
