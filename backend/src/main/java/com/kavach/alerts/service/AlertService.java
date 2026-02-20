package com.kavach.alerts.service;

import com.kavach.alerts.dto.*;
import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.entity.AlertRule;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.alerts.repository.AlertRuleRepository;
import com.kavach.devices.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRuleRepository ruleRepo;
    private final AlertRepository alertRepo;
    private final DeviceRepository deviceRepo;

    // ── Rules CRUD ────────────────────────────────────────────────────────────

    public List<AlertRuleDto> getRules(UUID tenantId) {
        return ruleRepo.findByTenantId(tenantId).stream().map(this::toRuleDto).toList();
    }

    @Transactional
    public AlertRuleDto createRule(UUID tenantId, UUID userId, CreateRuleRequest req) {
        AlertRule rule = AlertRule.builder()
            .tenantId(tenantId)
            .createdBy(userId)
            .name(req.getName())
            .ruleType(com.kavach.alerts.entity.RuleType.valueOf(req.getRuleType()))
            .config(req.getConfig())
            .appliesTo(req.getAppliesTo())
            .deviceId(req.getDeviceId())
            .severity(req.getSeverity())
            .notifyPush(req.isNotifyPush())
            .notifyEmail(req.isNotifyEmail())
            .notifySms(req.isNotifySms())
            .cooldownMinutes(req.getCooldownMinutes())
            .build();
        return toRuleDto(ruleRepo.save(rule));
    }

    @Transactional
    public AlertRuleDto toggleRule(UUID ruleId, UUID tenantId) {
        AlertRule rule = ruleRepo.findById(ruleId)
            .filter(r -> r.getTenantId().equals(tenantId))
            .orElseThrow(() -> new NoSuchElementException("Rule not found"));
        rule.setActive(!rule.isActive());
        rule.setUpdatedAt(LocalDateTime.now());
        return toRuleDto(ruleRepo.save(rule));
    }

    @Transactional
    public void deleteRule(UUID ruleId, UUID tenantId) {
        AlertRule rule = ruleRepo.findById(ruleId)
            .filter(r -> r.getTenantId().equals(tenantId))
            .orElseThrow(() -> new NoSuchElementException("Rule not found"));
        ruleRepo.delete(rule);
    }

    // ── Alerts feed ───────────────────────────────────────────────────────────

    public AlertsPageDto getAlerts(UUID tenantId, int page, int size) {
        PageRequest pr = PageRequest.of(page, size);
        Page<Alert> alertPage = alertRepo
            .findByTenantIdAndDismissedFalseOrderByTriggeredAtDesc(tenantId, pr);

        long unread = alertRepo.countByTenantIdAndReadFalseAndDismissedFalse(tenantId);

        List<AlertDto> dtos = alertPage.getContent().stream()
            .map(this::toAlertDto)
            .toList();

        return AlertsPageDto.builder()
            .alerts(dtos)
            .totalCount(alertPage.getTotalElements())
            .unreadCount(unread)
            .page(page)
            .pageSize(size)
            .hasMore(alertPage.hasNext())
            .build();
    }

    @Transactional
    public void markRead(UUID alertId, UUID tenantId) {
        alertRepo.findById(alertId)
            .filter(a -> a.getTenantId().equals(tenantId))
            .ifPresent(a -> { a.setRead(true); alertRepo.save(a); });
    }

    @Transactional
    public void markAllRead(UUID tenantId) {
        alertRepo.markAllRead(tenantId);
    }

    @Transactional
    public void dismiss(UUID alertId, UUID tenantId) {
        alertRepo.findById(alertId)
            .filter(a -> a.getTenantId().equals(tenantId))
            .ifPresent(a -> { a.setDismissed(true); a.setRead(true); alertRepo.save(a); });
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AlertRuleDto toRuleDto(AlertRule r) {
        return AlertRuleDto.builder()
            .id(r.getId()).name(r.getName())
            .ruleType(r.getRuleType().name()).config(r.getConfig())
            .appliesTo(r.getAppliesTo()).deviceId(r.getDeviceId())
            .severity(r.getSeverity()).active(r.isActive())
            .notifyPush(r.isNotifyPush()).notifyEmail(r.isNotifyEmail())
            .notifySms(r.isNotifySms()).cooldownMinutes(r.getCooldownMinutes())
            .lastTriggered(r.getLastTriggered()).createdAt(r.getCreatedAt())
            .build();
    }

    private AlertDto toAlertDto(Alert a) {
        String deviceName = a.getDeviceId() != null
            ? deviceRepo.findById(a.getDeviceId())
                .map(d -> d.getName()).orElse("Unknown Device")
            : null;

        return AlertDto.builder()
            .id(a.getId()).ruleType(a.getRuleType())
            .severity(a.getSeverity()).title(a.getTitle())
            .message(a.getMessage()).metadata(a.getMetadata())
            .read(a.isRead()).dismissed(a.isDismissed())
            .triggeredAt(a.getTriggeredAt())
            .triggeredAtRelative(formatRelative(a.getTriggeredAt()))
            .deviceId(a.getDeviceId()).deviceName(deviceName)
            .build();
    }

    private String formatRelative(LocalDateTime time) {
        if (time == null) return "";
        long mins = ChronoUnit.MINUTES.between(time, LocalDateTime.now());
        if (mins < 1) return "Just now";
        if (mins < 60) return mins + "m ago";
        long hours = ChronoUnit.HOURS.between(time, LocalDateTime.now());
        if (hours < 24) return hours + "h ago";
        return ChronoUnit.DAYS.between(time, LocalDateTime.now()) + "d ago";
    }
}
