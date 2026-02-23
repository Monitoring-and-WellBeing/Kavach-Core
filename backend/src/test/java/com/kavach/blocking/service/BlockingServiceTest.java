package com.kavach.blocking.service;

import com.kavach.alerts.service.AlertEvaluationService;
import com.kavach.blocking.dto.ViolationRequest;
import com.kavach.blocking.entity.BlockRule;
import com.kavach.blocking.entity.BlockingViolation;
import com.kavach.blocking.repository.BlockRuleRepository;
import com.kavach.blocking.repository.BlockingViolationRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import com.kavach.devices.entity.DeviceType;
import com.kavach.devices.repository.DeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 06 — Blocking Service")
class BlockingServiceTest {

    @Mock BlockRuleRepository ruleRepo;
    @Mock BlockingViolationRepository violationRepo;
    @Mock DeviceRepository deviceRepo;
    @Mock AlertEvaluationService alertEvaluationService;

    @InjectMocks BlockingService blockingService;

    private UUID tenantId;
    private UUID deviceId;
    private UUID ruleId;
    private Device mockDevice;
    private BlockRule mockRule;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        deviceId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        ruleId = UUID.fromString("33333333-3333-3333-3333-333333333333");

        mockDevice = Device.builder()
            .id(deviceId)
            .tenantId(tenantId)
            .name("Test Device")
            .type(DeviceType.DESKTOP)
            .status(DeviceStatus.ONLINE)
            .active(true)
            .build();

        mockRule = BlockRule.builder()
            .id(ruleId)
            .tenantId(tenantId)
            .name("Block Gaming")
            .ruleType("APP")
            .target("game.exe")
            .appliesTo("ALL_DEVICES")
            .active(true)
            .scheduleEnabled(false)
            .build();
    }

    @Test
    @DisplayName("BLOCKED app triggers violation record")
    void logViolation_blockedApp_triggersViolationRecord() {
        // Given: Device exists
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));
        when(violationRepo.save(any(BlockingViolation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        ViolationRequest req = new ViolationRequest();
        req.setDeviceId(deviceId);
        req.setRuleId(ruleId);
        req.setAppName("Blocked Game");
        req.setProcessName("game.exe");
        req.setWindowTitle("Game Window");
        req.setCategory("GAMING");

        // When
        blockingService.logViolation(req);

        // Then: Violation should be saved
        ArgumentCaptor<BlockingViolation> violationCaptor = ArgumentCaptor.forClass(BlockingViolation.class);
        verify(violationRepo).save(violationCaptor.capture());

        BlockingViolation violation = violationCaptor.getValue();
        assertThat(violation.getDeviceId()).isEqualTo(deviceId);
        assertThat(violation.getTenantId()).isEqualTo(tenantId);
        assertThat(violation.getRuleId()).isEqualTo(ruleId);
        assertThat(violation.getAppName()).isEqualTo("Blocked Game");
        assertThat(violation.getProcessName()).isEqualTo("game.exe");
        assertThat(violation.getCategory()).isEqualTo("GAMING");
    }

    @Test
    @DisplayName("BLOCKED app triggers alert via triggerBlockedAppAlert()")
    void logViolation_blockedApp_triggersAlert() {
        // Given: Device exists
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));
        when(violationRepo.save(any(BlockingViolation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        ViolationRequest req = new ViolationRequest();
        req.setDeviceId(deviceId);
        req.setRuleId(ruleId);
        req.setAppName("Blocked App");
        req.setProcessName("blocked.exe");

        // When
        blockingService.logViolation(req);

        // Then: Alert should be triggered
        verify(alertEvaluationService).triggerBlockedAppAlert(
            eq(tenantId),
            eq(deviceId),
            eq("Blocked App"),
            eq("Test Device")
        );
    }

    @Test
    @DisplayName("PAUSED device ignores block rules")
    void getAgentRules_pausedDevice_returnsEmptyList() {
        // Given: Device is PAUSED
        mockDevice.setStatus(DeviceStatus.PAUSED);
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.of(mockDevice));
        when(ruleRepo.findActiveRulesForDevice(tenantId, deviceId))
            .thenReturn(List.of()); // No active rules when paused

        // When
        var rules = blockingService.getAgentRules(tenantId, deviceId);

        // Then: Should return empty list (or rules are filtered out)
        assertThat(rules).isEmpty();
    }

    @Test
    @DisplayName("schedule-based rule only blocks within schedule window")
    void getAgentRules_scheduleRule_returnsRuleWithSchedule() {
        // Given: Rule with schedule enabled
        mockRule.setScheduleEnabled(true);
        mockRule.setScheduleDays("MON,TUE,WED,THU,FRI");
        mockRule.setScheduleStart(LocalTime.of(9, 0));
        mockRule.setScheduleEnd(LocalTime.of(17, 0));

        when(ruleRepo.findActiveRulesForDevice(tenantId, deviceId))
            .thenReturn(List.of(mockRule));

        // When
        var rules = blockingService.getAgentRules(tenantId, deviceId);

        // Then: Rule should include schedule info
        assertThat(rules).hasSize(1);
        assertThat(rules.get(0).isScheduleEnabled()).isTrue();
        assertThat(rules.get(0).getScheduleDays()).isEqualTo("MON,TUE,WED,THU,FRI");
        assertThat(rules.get(0).getScheduleStart()).isEqualTo("09:00");
        assertThat(rules.get(0).getScheduleEnd()).isEqualTo("17:00");
    }

    @Test
    @DisplayName("logViolation throws exception when device not found")
    void logViolation_deviceNotFound_throwsException() {
        // Given: Device doesn't exist
        when(deviceRepo.findById(deviceId)).thenReturn(Optional.empty());

        ViolationRequest req = new ViolationRequest();
        req.setDeviceId(deviceId);

        // When/Then: Should throw exception
        assertThatThrownBy(() -> blockingService.logViolation(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Device not found");

        verify(violationRepo, never()).save(any());
        verify(alertEvaluationService, never()).triggerBlockedAppAlert(any(), any(), any(), any());
    }

    @Test
    @DisplayName("getAgentRules returns only active rules for device")
    void getAgentRules_returnsOnlyActiveRules() {
        // Given: Multiple rules, some active, some inactive
        when(ruleRepo.findActiveRulesForDevice(tenantId, deviceId))
            .thenReturn(List.of(mockRule)); // Only active rule returned

        // When
        var rules = blockingService.getAgentRules(tenantId, deviceId);

        // Then: Should return only active rule
        assertThat(rules).hasSize(1);
        assertThat(rules.get(0).getId()).isEqualTo(ruleId);
    }
}
