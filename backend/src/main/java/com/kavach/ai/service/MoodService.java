package com.kavach.ai.service;

import com.kavach.ai.dto.MoodCheckinRequest;
import com.kavach.ai.dto.MoodCheckinResponse;
import com.kavach.ai.dto.MoodTrendItem;
import com.kavach.ai.entity.MoodCheckin;
import com.kavach.ai.repository.AiMoodCheckinRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service("aiMoodService")
@RequiredArgsConstructor
@Slf4j
public class MoodService {

    private final AiMoodCheckinRepository moodRepo;

    // ── Submit mood check-in ───────────────────────────────────────────────────

    public MoodCheckinResponse submitCheckin(UUID studentId, UUID tenantId,
                                              MoodCheckinRequest req) {
        // Guard: one check-in per day
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        int todayCount = moodRepo.countTodayByStudent(studentId, startOfDay);
        if (todayCount > 0) {
            return MoodCheckinResponse.builder()
                    .mood(req.getMood())
                    .moodLabel(req.getMoodLabel())
                    .checkedInAt(Instant.now())
                    .xpEarned(0)
                    .message("You've already checked in today! See you tomorrow. 🌟")
                    .build();
        }

        UUID deviceId = req.getDeviceId() != null
                ? UUID.fromString(req.getDeviceId()) : null;

        MoodCheckin checkin = moodRepo.save(MoodCheckin.builder()
                .studentId(studentId)
                .deviceId(deviceId)
                .tenantId(tenantId)
                .mood(req.getMood())
                .moodLabel(req.getMoodLabel())
                .note(req.getNote())
                .checkedInAt(Instant.now())
                .build());

        return MoodCheckinResponse.builder()
                .id(checkin.getId())
                .mood(checkin.getMood())
                .moodLabel(checkin.getMoodLabel())
                .checkedInAt(checkin.getCheckedInAt())
                .xpEarned(10)
                .message("+10 XP earned for checking in! 🎉")
                .build();
    }

    // ── 7-day mood trend for parent ────────────────────────────────────────────

    public List<MoodTrendItem> getMoodHistory(UUID deviceId) {
        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        List<MoodCheckin> checkins = moodRepo
                .findByDeviceIdAndCheckedInAtAfterOrderByCheckedInAtAsc(deviceId, since);

        return checkins.stream()
                .map(c -> MoodTrendItem.builder()
                        .checkedInAt(c.getCheckedInAt())
                        .mood(c.getMood())
                        .moodLabel(c.getMoodLabel())
                        .dayLabel(c.getCheckedInAt()
                                .atZone(ZoneOffset.UTC)
                                .getDayOfWeek()
                                .getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                        .build())
                .toList();
    }

    // ── Weekly mood summary (text) for AI digest ───────────────────────────────

    public String getWeeklyMoodSummary(UUID studentId) {
        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        List<MoodCheckin> checkins = moodRepo.findWeeklyByStudent(studentId, since);

        if (checkins.isEmpty()) return "No mood check-ins this week.";

        StringBuilder sb = new StringBuilder("Mood check-ins this week: ");
        checkins.forEach(c -> {
            String day = c.getCheckedInAt()
                    .atZone(ZoneOffset.UTC)
                    .getDayOfWeek()
                    .getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            String label = c.getMoodLabel() != null ? c.getMoodLabel()
                    : moodValueToLabel(c.getMood());
            sb.append(day).append(" ").append(label).append(", ");
        });
        return sb.toString().replaceAll(", $", "");
    }

    // ── Weekly mood summary by device (for InsightService) ────────────────────

    public String getWeeklyMoodSummaryByDevice(UUID deviceId) {
        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        List<MoodCheckin> checkins = moodRepo.findWeeklyByDevice(deviceId, since);

        if (checkins.isEmpty()) return "No mood check-ins this week.";

        StringBuilder sb = new StringBuilder("Mood check-ins this week: ");
        checkins.forEach(c -> {
            String day = c.getCheckedInAt()
                    .atZone(ZoneOffset.UTC)
                    .getDayOfWeek()
                    .getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            String label = c.getMoodLabel() != null ? c.getMoodLabel()
                    : moodValueToLabel(c.getMood());
            sb.append(day).append(" ").append(label).append(", ");
        });
        return sb.toString().replaceAll(", $", "");
    }

    private String moodValueToLabel(int value) {
        return switch (value) {
            case 5 -> "great";
            case 4 -> "good";
            case 3 -> "okay";
            case 2 -> "tired";
            case 1 -> "stressed";
            default -> "okay";
        };
    }
}
