package com.kavach.challenges.service;

import com.kavach.challenges.dto.DailyChallengeDto;
import com.kavach.challenges.dto.StreakDto;
import com.kavach.challenges.entity.ChallengeTemplate;
import com.kavach.challenges.entity.DailyChallenge;
import com.kavach.challenges.entity.StreakRecovery;
import com.kavach.challenges.repository.ChallengeTemplateRepository;
import com.kavach.challenges.repository.DailyChallengeRepository;
import com.kavach.challenges.repository.StreakRecoveryRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.gamification.service.BadgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChallengeService {

    private final ChallengeTemplateRepository templateRepository;
    private final DailyChallengeRepository challengeRepository;
    private final StreakRecoveryRepository streakRecoveryRepository;
    private final DeviceRepository deviceRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final BadgeService badgeService;

    // ── Midnight scheduler: assign 3 challenges to every active device ────────
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void assignDailyChallengesForAll() {
        List<Device> activeDevices = deviceRepository.findAllByActiveTrue();
        log.info("[challenges] Assigning daily challenges to {} devices", activeDevices.size());
        for (Device device : activeDevices) {
            try {
                assignChallengesForDevice(device.getId(), device.getTenantId());
            } catch (Exception e) {
                log.warn("[challenges] Failed to assign for device {}: {}", device.getId(), e.getMessage());
            }
        }
    }

    // ── Assign challenges for a single device ─────────────────────────────────
    @Transactional
    public void assignChallengesForDevice(UUID deviceId, UUID tenantId) {
        // Skip if already assigned today
        List<DailyChallenge> existing =
            challengeRepository.findByDeviceIdAndDate(deviceId, LocalDate.now());
        if (!existing.isEmpty()) return;

        List<ChallengeTemplate> templates = new ArrayList<>(templateRepository.findByActiveTrue());
        Collections.shuffle(templates);

        // 2 easy/medium + 1 hard
        List<ChallengeTemplate> selected = templates.stream()
            .filter(t -> !"HARD".equals(t.getDifficulty()))
            .limit(2)
            .collect(Collectors.toList());

        templates.stream()
            .filter(t -> "HARD".equals(t.getDifficulty()))
            .findFirst()
            .ifPresent(selected::add);

        for (ChallengeTemplate template : selected) {
            DailyChallenge challenge = DailyChallenge.builder()
                .deviceId(deviceId)
                .tenantId(tenantId)
                .templateId(template.getId())
                .challengeDate(LocalDate.now())
                .targetValue(template.getTargetValue())
                .xpReward(template.getXpReward())
                .build();

            try {
                challengeRepository.save(challenge);
            } catch (Exception e) {
                // Ignore unique constraint violations (race condition)
                log.debug("[challenges] Skipped duplicate for device {}: {}", deviceId, e.getMessage());
            }
        }
    }

    // ── Update progress when a relevant action occurs ─────────────────────────
    @Transactional
    public void updateChallengeProgress(UUID deviceId, String challengeType, int progressValue) {
        List<DailyChallenge> todayChallenges =
            challengeRepository.findByDeviceIdAndDateAndType(deviceId, LocalDate.now(), challengeType);

        for (DailyChallenge challenge : todayChallenges) {
            if (challenge.isCompleted()) continue;

            challenge.setCurrentValue(challenge.getCurrentValue() + progressValue);

            if (challenge.getCurrentValue() >= challenge.getTargetValue()) {
                challenge.setCompleted(true);
                challenge.setCompletedAt(Instant.now());

                // Award XP for completing the challenge
                badgeService.addXp(
                    deviceId,
                    challenge.getTenantId(),
                    challenge.getXpReward(),
                    "Daily challenge: " + (challenge.getTemplate() != null
                        ? challenge.getTemplate().getTitle() : challengeType)
                );
                log.info("[challenges] {} completed '{}' (+{} XP)",
                    deviceId, challengeType, challenge.getXpReward());
            }

            challengeRepository.save(challenge);
        }
    }

    // ── Get today's challenges for a device (assign if none yet) ─────────────
    @Transactional
    public List<DailyChallengeDto> getTodayChallenges(UUID deviceId) {
        // Ensure device has challenges
        Device device = deviceRepository.findById(deviceId)
            .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        assignChallengesForDevice(deviceId, device.getTenantId());

        List<DailyChallenge> challenges =
            challengeRepository.findByDeviceIdAndDate(deviceId, LocalDate.now());

        return challenges.stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── Streak info ───────────────────────────────────────────────────────────
    public StreakDto getStreakInfo(UUID deviceId) {
        int streak = calculateStreak(deviceId);
        int longest = calculateLongestStreak(deviceId);
        boolean broken = !hadFocusSessionYesterday(deviceId) && streak == 0
            && hadFocusSessionRecently(deviceId);

        StreakRecovery recovery = streakRecoveryRepository.findByDeviceId(deviceId)
            .orElse(StreakRecovery.builder().deviceId(deviceId).tokensAvailable(0).build());

        // Build last 7 days
        List<Boolean> last7 = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            long sessions = focusSessionRepository.countCompletedSince(deviceId, day.atStartOfDay());
            last7.add(sessions > 0);
            labels.add(day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
        }

        return StreakDto.builder()
            .currentStreak(streak)
            .longestStreak(longest)
            .recoveryTokens(recovery.getTokensAvailable())
            .last7Days(last7)
            .dayLabels(labels)
            .streakBroken(broken)
            .build();
    }

    // ── Use a recovery token to restore a broken streak ───────────────────────
    @Transactional
    public StreakDto useRecoveryToken(UUID deviceId) {
        StreakRecovery recovery = streakRecoveryRepository.findByDeviceId(deviceId)
            .orElseThrow(() -> new IllegalStateException("No recovery tokens available"));

        if (recovery.getTokensAvailable() <= 0) {
            throw new IllegalStateException("No recovery tokens available");
        }

        recovery.setTokensAvailable(recovery.getTokensAvailable() - 1);
        recovery.setLastUpdated(Instant.now());
        streakRecoveryRepository.save(recovery);

        log.info("[challenges] Device {} used a streak recovery token ({} left)",
            deviceId, recovery.getTokensAvailable());

        return getStreakInfo(deviceId);
    }

    // ── Grant recovery tokens (called from badge system on milestones) ─────────
    @Transactional
    public void grantRecoveryToken(UUID deviceId) {
        StreakRecovery recovery = streakRecoveryRepository.findByDeviceId(deviceId)
            .orElse(StreakRecovery.builder().deviceId(deviceId).tokensAvailable(0).build());

        recovery.setTokensAvailable(recovery.getTokensAvailable() + 1);
        recovery.setLastUpdated(Instant.now());
        streakRecoveryRepository.save(recovery);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private int calculateStreak(UUID deviceId) {
        int streak = 0;
        LocalDate date = LocalDate.now();
        while (true) {
            long sessions = focusSessionRepository.countCompletedSince(deviceId, date.atStartOfDay());
            if (sessions == 0 && !date.equals(LocalDate.now())) break;
            if (sessions > 0) streak++;
            date = date.minusDays(1);
            if (streak > 365) break;
        }
        return streak;
    }

    private int calculateLongestStreak(UUID deviceId) {
        int longest = 0;
        int current = 0;
        for (int i = 0; i < 90; i++) {
            LocalDate day = LocalDate.now().minusDays(i);
            long s = focusSessionRepository.countCompletedSince(deviceId, day.atStartOfDay());
            if (s > 0) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 0;
            }
        }
        return longest;
    }

    private boolean hadFocusSessionYesterday(UUID deviceId) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        return focusSessionRepository.countCompletedSince(deviceId, yesterday.atStartOfDay()) > 0;
    }

    private boolean hadFocusSessionRecently(UUID deviceId) {
        LocalDate threeDaysAgo = LocalDate.now().minusDays(3);
        return focusSessionRepository.countCompletedSince(deviceId, threeDaysAgo.atStartOfDay()) > 0;
    }

    private DailyChallengeDto toDto(DailyChallenge c) {
        ChallengeTemplate t = c.getTemplate();
        return DailyChallengeDto.builder()
            .id(c.getId())
            .title(t != null ? t.getTitle() : "")
            .description(t != null ? t.getDescription() : "")
            .icon(t != null ? t.getIcon() : "⚡")
            .challengeType(t != null ? t.getChallengeType() : "")
            .difficulty(t != null ? t.getDifficulty() : "EASY")
            .xpReward(c.getXpReward())
            .currentValue(c.getCurrentValue())
            .targetValue(c.getTargetValue())
            .completed(c.isCompleted())
            .completedAt(c.getCompletedAt())
            .build();
    }
}
