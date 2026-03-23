package com.kavach.enforcement.service;

import com.kavach.alerts.service.AlertEvaluationService;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.enforcement.dto.EnforcementEventDto;
import com.kavach.enforcement.entity.EnforcementEvent;
import com.kavach.enforcement.repository.EnforcementEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnforcementService {

    private final EnforcementEventRepository eventRepo;
    private final DeviceRepository deviceRepo;
    private final AlertEvaluationService alertEvaluationService;

    /**
     * Persist an enforcement event posted by the desktop agent.
     * Also fires a parent alert for high-severity actions.
     */
    @Transactional
    public void save(EnforcementEventDto dto) {
        var device = deviceRepo.findById(dto.getDeviceId())
                .orElseThrow(() -> new IllegalArgumentException("Device not found: " + dto.getDeviceId()));

        Instant ts;
        try {
            ts = dto.getTimestamp() != null
                    ? Instant.parse(dto.getTimestamp())
                    : Instant.now();
        } catch (Exception e) {
            ts = Instant.now();
        }

        EnforcementEvent event = EnforcementEvent.builder()
                .deviceId(dto.getDeviceId())
                .ruleId(dto.getRuleId())
                .tenantId(device.getTenantId())
                .processName(dto.getProcessName())
                .action(dto.getAction())
                .detail(dto.getDetail())
                .platform(dto.getPlatform() != null ? dto.getPlatform() : "WINDOWS")
                .timestamp(ts)
                .build();

        eventRepo.save(event);

        // Fire parent alert for kill-tool detection (high severity)
        if ("KILL_TOOL_DETECTED".equals(dto.getAction())) {
            alertEvaluationService.triggerKillToolAlert(
                    device.getTenantId(),
                    device.getId(),
                    dto.getProcessName(),
                    device.getName()
            );
        }

        log.info("[enforcement] {} on device {} — process: {}",
                dto.getAction(), device.getName(), dto.getProcessName());
    }
}
