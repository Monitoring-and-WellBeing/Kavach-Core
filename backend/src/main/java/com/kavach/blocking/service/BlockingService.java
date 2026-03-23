package com.kavach.blocking.service;

import com.kavach.alerts.service.AlertEvaluationService;
import com.kavach.blocking.dto.*;
import com.kavach.blocking.entity.BlockRule;
import com.kavach.blocking.entity.BlockingViolation;
import com.kavach.blocking.repository.BlockRuleRepository;
import com.kavach.blocking.repository.BlockingViolationRepository;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.enforcement.repository.EnforcementStateRepository;
import com.kavach.sse.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlockingService {

    private final BlockRuleRepository         ruleRepo;
    private final BlockingViolationRepository violationRepo;
    private final DeviceRepository            deviceRepo;
    private final AlertEvaluationService      alertEvaluationService;
    private final EnforcementStateRepository  enforcementStateRepository;
    private final ApplicationEventPublisher   eventPublisher;

    // ── Rules CRUD ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BlockRuleDto> getRules(UUID tenantId) {
        return ruleRepo.findByTenantId(tenantId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AgentBlockRuleDto> getAgentRules(UUID tenantId, UUID deviceId) {
        return ruleRepo.findActiveRulesForDevice(tenantId, deviceId)
                .stream().map(this::toAgentDto).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAgentRulesWithMetadata(UUID tenantId, UUID deviceId) {
        var device = deviceRepo.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("Device not found"));

        List<AgentBlockRuleDto> rules = ruleRepo.findActiveRulesForDevice(tenantId, deviceId)
                .stream().map(this::toAgentDto).toList();

        return Map.of(
            "rules",       rules,
            "lastUpdated", device.getRulesUpdatedAt(),
            "serverTime",  LocalDateTime.now()
        );
    }

    @Transactional
    public BlockRuleDto createRule(UUID tenantId, UUID userId, CreateBlockRuleRequest req) {
        BlockRule rule = BlockRule.builder()
                .tenantId(tenantId)
                .createdBy(userId)
                .name(req.getName())
                .ruleType(req.getRuleType().toUpperCase())
                .target(req.getTarget())
                .appliesTo(req.getAppliesTo())
                .deviceId(req.getDeviceId())
                .scheduleEnabled(req.isScheduleEnabled())
                .scheduleDays(req.getScheduleDays())
                .scheduleStart(req.getScheduleStart())
                .scheduleEnd(req.getScheduleEnd())
                .showMessage(req.isShowMessage())
                .blockMessage(req.getBlockMessage())
                .build();
        rule = ruleRepo.save(rule);

        updateDeviceRulesTimestamp(req.getDeviceId(), tenantId);

        // Event published AFTER_COMMIT via SseEventListener — no phantom pushes on rollback.
        publishRulesUpdated(tenantId, req.getDeviceId());
        return toDto(rule);
    }

    @Transactional
    public BlockRuleDto toggleRule(UUID ruleId, UUID tenantId) {
        BlockRule rule = ruleRepo.findById(ruleId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Rule not found"));
        rule.setActive(!rule.isActive());
        rule.setUpdatedAt(LocalDateTime.now());
        rule = ruleRepo.save(rule);

        updateDeviceRulesTimestamp(rule.getDeviceId(), rule.getTenantId());
        publishRulesUpdated(tenantId, rule.getDeviceId());
        return toDto(rule);
    }

    @Transactional
    public void deleteRule(UUID ruleId, UUID tenantId) {
        BlockRule rule = ruleRepo.findById(ruleId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Rule not found"));

        UUID deviceId = rule.getDeviceId();
        ruleRepo.delete(rule);

        updateDeviceRulesTimestamp(deviceId, tenantId);
        publishRulesUpdated(tenantId, deviceId);
    }

    /** Publishes a RulesUpdated domain event; SSE delivery happens AFTER_COMMIT. */
    private void publishRulesUpdated(UUID tenantId, UUID deviceId) {
        eventPublisher.publishEvent(new SseEvent.RulesUpdated(
            tenantId.toString(),
            deviceId != null ? deviceId.toString() : null
        ));
    }

    private void updateDeviceRulesTimestamp(UUID deviceId, UUID tenantId) {
        if (deviceId != null) {
            deviceRepo.findById(deviceId).ifPresent(d -> {
                d.setRulesUpdatedAt(LocalDateTime.now());
                deviceRepo.save(d);
            });
            enforcementStateRepository.incrementVersion(deviceId);
        } else {
            deviceRepo.findByTenantIdAndActiveTrue(tenantId).forEach(d -> {
                d.setRulesUpdatedAt(LocalDateTime.now());
                deviceRepo.save(d);
            });
            enforcementStateRepository.incrementVersionForTenant(tenantId);
        }
    }

    // ── Violation logging (called by desktop agent) ───────────────────────────
    @Transactional
    public void logViolation(ViolationRequest req) {
        var device = deviceRepo.findById(req.getDeviceId())
                .orElseThrow(() -> new IllegalArgumentException("Device not found"));

        BlockingViolation violation = BlockingViolation.builder()
                .tenantId(device.getTenantId())
                .deviceId(req.getDeviceId())
                .ruleId(req.getRuleId())
                .appName(req.getAppName())
                .processName(req.getProcessName())
                .windowTitle(req.getWindowTitle())
                .category(req.getCategory())
                .build();

        violationRepo.save(violation);

        alertEvaluationService.triggerBlockedAppAlert(
                device.getTenantId(),
                device.getId(),
                req.getAppName(),
                device.getName()
        );

        log.info("[blocking] Violation logged: {} on device {}", req.getAppName(), device.getName());
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public long getViolationCountToday(UUID deviceId) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return violationRepo.countByDeviceIdAndAttemptedAtAfter(deviceId, startOfDay);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────
    private BlockRuleDto toDto(BlockRule r) {
        return BlockRuleDto.builder()
                .id(r.getId()).name(r.getName())
                .ruleType(r.getRuleType()).target(r.getTarget())
                .appliesTo(r.getAppliesTo()).deviceId(r.getDeviceId())
                .scheduleEnabled(r.isScheduleEnabled())
                .scheduleDays(r.getScheduleDays())
                .scheduleStart(r.getScheduleStart())
                .scheduleEnd(r.getScheduleEnd())
                .showMessage(r.isShowMessage())
                .blockMessage(r.getBlockMessage())
                .active(r.isActive())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private AgentBlockRuleDto toAgentDto(BlockRule r) {
        DateTimeFormatter tf = DateTimeFormatter.ofPattern("HH:mm");
        return AgentBlockRuleDto.builder()
                .id(r.getId()).ruleType(r.getRuleType()).target(r.getTarget())
                .scheduleEnabled(r.isScheduleEnabled())
                .scheduleDays(r.getScheduleDays())
                .scheduleStart(r.getScheduleStart() != null ? r.getScheduleStart().format(tf) : null)
                .scheduleEnd(r.getScheduleEnd() != null ? r.getScheduleEnd().format(tf) : null)
                .blockMessage(r.getBlockMessage())
                .build();
    }
}
