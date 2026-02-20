package com.kavach.focus.service;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.dto.*;
import com.kavach.focus.entity.FocusSession;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.focus.repository.FocusWhitelistRepository;
import com.kavach.gamification.service.BadgeEvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FocusService {

    private final FocusSessionRepository sessionRepo;
    private final FocusWhitelistRepository whitelistRepo;
    private final DeviceRepository deviceRepo;
    private final BadgeEvaluationService badgeEvaluationService;

    // ── Start a focus session ─────────────────────────────────────────────────
    @Transactional
    public FocusSessionDto startSession(UUID tenantId, UUID initiatedBy,
                                        String initiatedRole, StartFocusRequest req) {
        // Cancel any existing active session for this device
        sessionRepo.findByDeviceIdAndStatus(req.getDeviceId(), "ACTIVE")
                .ifPresent(s -> {
                    s.setStatus("CANCELLED");
                    s.setEndReason("CANCELLED_BY_" + initiatedRole);
                    s.setEndedAt(LocalDateTime.now());
                    sessionRepo.save(s);
                });

        LocalDateTime now    = LocalDateTime.now();
        LocalDateTime endsAt = now.plusMinutes(req.getDurationMinutes());

        FocusSession session = FocusSession.builder()
                .tenantId(tenantId)
                .deviceId(req.getDeviceId())
                .initiatedBy(initiatedBy)
                .initiatedRole(initiatedRole)
                .title(req.getTitle())
                .durationMinutes(req.getDurationMinutes())
                .startedAt(now)
                .endsAt(endsAt)
                .status("ACTIVE")
                .build();

        session = sessionRepo.save(session);
        log.info("[focus] Session started: {} min on device {}", req.getDurationMinutes(), req.getDeviceId());
        return toDto(session);
    }

    // ── Stop a focus session ──────────────────────────────────────────────────
    @Transactional
    public FocusSessionDto stopSession(UUID sessionId, UUID tenantId, String cancelledBy) {
        FocusSession session = sessionRepo.findById(sessionId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new NoSuchElementException("Session not found"));

        session.setStatus("CANCELLED");
        session.setEndReason("CANCELLED_BY_" + cancelledBy);
        session.setEndedAt(LocalDateTime.now());
        return toDto(sessionRepo.save(session));
    }

    // ── Get active session for device ────────────────────────────────────────
    public FocusSessionDto getActiveSession(UUID deviceId) {
        return sessionRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE")
                .map(this::toDto)
                .orElse(null);
    }

    // ── Session history for a device ──────────────────────────────────────────
    public List<FocusSessionDto> getSessionHistory(UUID deviceId) {
        return sessionRepo.findByDeviceIdOrderByStartedAtDesc(deviceId)
                .stream().limit(20).map(this::toDto).toList();
    }

    // ── Agent polling endpoint ────────────────────────────────────────────────
    public AgentFocusStatusDto getAgentStatus(UUID deviceId) {
        var activeSession = sessionRepo.findByDeviceIdAndStatus(deviceId, "ACTIVE");

        if (activeSession.isEmpty()) {
            return AgentFocusStatusDto.builder().focusActive(false).build();
        }

        FocusSession session = activeSession.get();
        long remaining = ChronoUnit.SECONDS.between(LocalDateTime.now(), session.getEndsAt());

        // Get whitelist for tenant
        List<String> whitelist = whitelistRepo
                .findByTenantId(session.getTenantId())
                .stream().map(w -> w.getProcessName().toLowerCase()).toList();

        return AgentFocusStatusDto.builder()
                .focusActive(true)
                .sessionId(session.getId())
                .title(session.getTitle())
                .remainingSeconds((int) Math.max(remaining, 0))
                .whitelistedProcesses(whitelist)
                .build();
    }

    // ── Whitelist management ──────────────────────────────────────────────────
    public List<String> getWhitelist(UUID tenantId) {
        return whitelistRepo.findByTenantId(tenantId)
                .stream().map(w -> w.getProcessName()).toList();
    }

    @Transactional
    public void addToWhitelist(UUID tenantId, String processName, String appName) {
        if (whitelistRepo.findByTenantIdAndProcessName(tenantId, processName).isEmpty()) {
            whitelistRepo.save(com.kavach.focus.entity.FocusWhitelist.builder()
                    .tenantId(tenantId).processName(processName).appName(appName).build());
        }
    }

    @Transactional
    public void removeFromWhitelist(UUID tenantId, String processName) {
        whitelistRepo.deleteByTenantIdAndProcessName(tenantId, processName);
    }

    // ── Stats for student dashboard ───────────────────────────────────────────
    public long getTodayFocusMinutes(UUID deviceId) {
        return sessionRepo.totalFocusMinutesSince(deviceId,
                LocalDate.now().atStartOfDay());
    }

    public long getTodaySessionCount(UUID deviceId) {
        return sessionRepo.countCompletedSince(deviceId,
                LocalDate.now().atStartOfDay());
    }

    // ── Scheduled: expire elapsed sessions every 30 seconds ──────────────────
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void expireElapsedSessions() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find sessions that should be expired
        List<FocusSession> expiredSessions = sessionRepo.findExpiredSessions(now);
        
        if (expiredSessions.isEmpty()) {
            return;
        }
        
        // Mark as COMPLETED (for badge purposes) and collect device IDs
        Set<UUID> affectedDevices = expiredSessions.stream()
            .map(s -> {
                s.setStatus("COMPLETED");
                s.setEndReason("COMPLETED");
                s.setEndedAt(now);
                return s.getDeviceId();
            })
            .collect(Collectors.toSet());
        
        sessionRepo.saveAll(expiredSessions);
        log.info("[focus] Completed {} sessions", expiredSessions.size());
        
        // Trigger badge evaluation for affected devices
        for (UUID deviceId : affectedDevices) {
            try {
                FocusSession firstSession = expiredSessions.stream()
                    .filter(s -> s.getDeviceId().equals(deviceId))
                    .findFirst()
                    .orElse(null);
                if (firstSession != null) {
                    badgeEvaluationService.evaluateAndAwardBadges(deviceId, firstSession.getTenantId());
                }
            } catch (Exception e) {
                log.warn("[focus] Failed to evaluate badges for device {}: {}", deviceId, e.getMessage());
            }
        }
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private FocusSessionDto toDto(FocusSession s) {
        long remainingSeconds = 0;
        double progress = 100;

        if ("ACTIVE".equals(s.getStatus())) {
            remainingSeconds = Math.max(
                ChronoUnit.SECONDS.between(LocalDateTime.now(), s.getEndsAt()), 0);
            long totalSeconds = s.getDurationMinutes() * 60L;
            long elapsed = totalSeconds - remainingSeconds;
            progress = Math.min((elapsed * 100.0 / totalSeconds), 100);
        }

        String deviceName = deviceRepo.findById(s.getDeviceId())
                .map(d -> d.getName()).orElse("Unknown Device");

        return FocusSessionDto.builder()
                .id(s.getId()).deviceId(s.getDeviceId()).deviceName(deviceName)
                .initiatedRole(s.getInitiatedRole()).title(s.getTitle())
                .durationMinutes(s.getDurationMinutes())
                .startedAt(s.getStartedAt()).endsAt(s.getEndsAt()).endedAt(s.getEndedAt())
                .status(s.getStatus()).endReason(s.getEndReason())
                .remainingSeconds((int) remainingSeconds)
                .progressPercent(Math.round(progress * 10.0) / 10.0)
                .build();
    }
}
