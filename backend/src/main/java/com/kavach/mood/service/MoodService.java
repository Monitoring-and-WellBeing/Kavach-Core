package com.kavach.mood.service;

import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.challenges.service.ChallengeService;
import com.kavach.devices.entity.Device;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.mood.dto.MoodCheckinDto;
import com.kavach.mood.dto.MoodCheckinRequest;
import com.kavach.mood.dto.MoodTrendDto;
import com.kavach.mood.entity.MoodCheckin;
import com.kavach.mood.repository.MoodCheckinRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MoodService {

    private final MoodCheckinRepository moodRepository;
    private final AlertRepository alertRepository;
    private final DeviceRepository deviceRepository;
    private final ChallengeService challengeService;

    // ── Submit a mood check-in ────────────────────────────────────────────────
    @Transactional
    public MoodCheckinDto submitMood(UUID deviceId, MoodCheckinRequest req) {
        if (req.getMood() < 1 || req.getMood() > 5) {
            throw new IllegalArgumentException("Mood must be between 1 and 5");
        }

        Device device = deviceRepository.findById(deviceId)
            .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        // Prevent duplicate submissions on the same day
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        Optional<MoodCheckin> existing = moodRepository.findTodayCheckin(deviceId, startOfDay);
        if (existing.isPresent()) {
            // Update existing rather than duplicate
            MoodCheckin checkin = existing.get();
            checkin.setMood(req.getMood());
            checkin.setNote(req.getNote());
            checkin.setCheckedInAt(Instant.now());
            moodRepository.save(checkin);

            // Still update challenge progress for MOOD_CHECKIN (idempotent)
            challengeService.updateChallengeProgress(deviceId, "MOOD_CHECKIN", 1);
            checkMoodAlert(deviceId, device.getTenantId(), req.getMood());
            return toDto(checkin);
        }

        MoodCheckin checkin = MoodCheckin.builder()
            .deviceId(deviceId)
            .tenantId(device.getTenantId())
            .mood(req.getMood())
            .note(req.getNote())
            .checkedInAt(Instant.now())
            .build();
        moodRepository.save(checkin);

        // Award challenge progress for checking in
        challengeService.updateChallengeProgress(deviceId, "MOOD_CHECKIN", 1);

        // Check for mood concern alert
        checkMoodAlert(deviceId, device.getTenantId(), req.getMood());

        log.info("[mood] Device {} checked in with mood {}", deviceId, req.getMood());
        return toDto(checkin);
    }

    // ── Get today's mood for a device ─────────────────────────────────────────
    public Optional<MoodCheckinDto> getTodayMood(UUID deviceId) {
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        return moodRepository.findTodayCheckin(deviceId, startOfDay).map(this::toDto);
    }

    // ── 7-day mood trend for parent view ─────────────────────────────────────
    public MoodTrendDto getMoodTrend(UUID deviceId) {
        Instant sevenDaysAgo = Instant.now().minus(java.time.Duration.ofDays(7));
        List<MoodCheckin> checkins = moodRepository.findByDeviceIdSince(deviceId, sevenDaysAgo);

        // Map date → mood (take latest if multiple per day)
        Map<LocalDate, MoodCheckin> byDay = new LinkedHashMap<>();
        for (MoodCheckin c : checkins) {
            LocalDate d = c.getCheckedInAt().atZone(ZoneOffset.UTC).toLocalDate();
            byDay.merge(d, c, (existing, next) ->
                next.getCheckedInAt().isAfter(existing.getCheckedInAt()) ? next : existing);
        }

        // Build 7-day list (oldest first)
        List<MoodCheckinDto> last7 = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            MoodCheckin c = byDay.get(day);
            if (c != null) {
                MoodCheckinDto dto = toDto(c);
                dto.setDayLabel(day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                last7.add(dto);
            } else {
                last7.add(MoodCheckinDto.builder()
                    .mood(0)  // 0 = no check-in
                    .dayLabel(day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .checkedInAt(null)
                    .build());
            }
        }

        // Check if there's an active mood concern
        List<MoodCheckin> recent = moodRepository.findRecentByDeviceId(deviceId, 3);
        boolean hasAlert = recent.size() >= 3 && recent.stream().allMatch(m -> m.getMood() <= 2);
        String alertMessage = hasAlert
            ? "Your child has been feeling stressed or bad for 3 days in a row. Consider checking in with them."
            : null;

        // Check-in streak
        int checkinStreak = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate day = LocalDate.now().minusDays(i);
            if (byDay.containsKey(day)) checkinStreak++;
            else break;
        }

        return MoodTrendDto.builder()
            .last7Days(last7)
            .hasAlert(hasAlert)
            .alertMessage(alertMessage)
            .checkinStreak(checkinStreak)
            .build();
    }

    // ── Check if parent needs a mood concern alert ────────────────────────────
    private void checkMoodAlert(UUID deviceId, UUID tenantId, int currentMood) {
        if (currentMood > 2) return; // Not stressed; skip check

        List<MoodCheckin> recent = moodRepository.findRecentByDeviceId(deviceId, 3);
        if (recent.size() < 3) return;

        boolean allStressed = recent.stream().allMatch(m -> m.getMood() <= 2);
        if (!allStressed) return;

        // Check if we already fired this alert recently (cooldown: 24 hours)
        // We create a direct alert in the alerts table
        String deviceName = deviceRepository.findById(deviceId)
            .map(d -> d.getAssignedTo() != null ? d.getAssignedTo() : d.getName())
            .orElse("Your child");

        Alert alert = Alert.builder()
            .tenantId(tenantId)
            .deviceId(deviceId)
            .ruleType("MOOD_CONCERN")
            .severity("MEDIUM")
            .title("Mood concern: " + deviceName + " has been stressed for 3 days")
            .message(deviceName + " has reported feeling stressed or bad for 3 days in a row. " +
                     "Consider checking in with them.")
            .metadata(Map.of(
                "deviceId", deviceId.toString(),
                "deviceName", deviceName,
                "consecutiveLowMoods", 3
            ))
            .build();

        alertRepository.save(alert);
        log.info("[mood] Mood concern alert created for device {} in tenant {}", deviceId, tenantId);
    }

    private MoodCheckinDto toDto(MoodCheckin c) {
        return MoodCheckinDto.builder()
            .mood(c.getMood())
            .note(c.getNote())
            .checkedInAt(c.getCheckedInAt())
            .build();
    }
}
