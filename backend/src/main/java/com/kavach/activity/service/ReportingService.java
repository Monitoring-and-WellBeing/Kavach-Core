package com.kavach.activity.service;

import com.kavach.activity.dto.*;
import com.kavach.activity.entity.ActivityLog;
import com.kavach.activity.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private final ActivityLogRepository activityRepo;

    private static final Map<String, String> CATEGORY_COLORS = Map.of(
        "EDUCATION",     "#3B82F6",
        "GAMING",        "#EF4444",
        "ENTERTAINMENT", "#F59E0B",
        "SOCIAL_MEDIA",  "#8B5CF6",
        "PRODUCTIVITY",  "#22C55E",
        "COMMUNICATION", "#06B6D4",
        "NEWS",          "#F97316",
        "OTHER",         "#6B7280"
    );

    // ── Daily report — screen time per hour ───────────────────────────────────
    public DailyReportDto getDailyReport(UUID deviceId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end   = date.plusDays(1).atStartOfDay();

        List<ActivityLog> logs = activityRepo
            .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, start, end);

        // Group by hour
        Map<Integer, Long> byHour = new HashMap<>();
        for (ActivityLog log : logs) {
            int hour = log.getStartedAt().getHour();
            byHour.merge(hour, (long) log.getDurationSeconds(), Long::sum);
        }

        long maxSeconds = byHour.values().stream().mapToLong(Long::longValue).max().orElse(1);
        long totalSeconds = byHour.values().stream().mapToLong(Long::longValue).sum();

        List<DailyReportDto.HourlySlot> hourly = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            long secs = byHour.getOrDefault(h, 0L);
            String label = h == 0 ? "12 AM" : h < 12 ? h + " AM" : h == 12 ? "12 PM" : (h-12) + " PM";
            int intensity = secs == 0 ? 0 : secs < maxSeconds * 0.33 ? 1 : secs < maxSeconds * 0.66 ? 2 : 3;
            hourly.add(new DailyReportDto.HourlySlot(h, label, secs, intensity));
        }

        return DailyReportDto.builder()
            .date(date.toString())
            .totalScreenTimeSeconds(totalSeconds)
            .totalScreenTimeFormatted(formatSeconds(totalSeconds))
            .hourly(hourly)
            .build();
    }

    // ── Weekly report — 7 days ─────────────────────────────────────────────────
    public WeeklyReportDto getWeeklyReport(UUID deviceId, LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(6);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = endDate.plusDays(1).atStartOfDay();

        List<ActivityLog> logs = activityRepo
            .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, start, end);

        // Group by date
        Map<LocalDate, List<ActivityLog>> byDate = logs.stream()
            .collect(Collectors.groupingBy(l -> l.getStartedAt().toLocalDate()));

        List<WeeklyReportDto.DaySlot> days = new ArrayList<>();
        long totalSeconds = 0;

        for (int i = 0; i < 7; i++) {
            LocalDate date = startDate.plusDays(i);
            List<ActivityLog> dayLogs = byDate.getOrDefault(date, List.of());

            long daySecs = dayLogs.stream().mapToLong(ActivityLog::getDurationSeconds).sum();
            totalSeconds += daySecs;

            // Category breakdown for this day
            Map<String, Long> catBreakdown = dayLogs.stream()
                .collect(Collectors.groupingBy(
                    l -> l.getCategory().name(),
                    Collectors.summingLong(ActivityLog::getDurationSeconds)
                ));

            days.add(new WeeklyReportDto.DaySlot(
                date.toString(),
                date.getDayOfWeek().toString().substring(0, 3),
                daySecs,
                catBreakdown
            ));
        }

        double avgDailyHours = days.stream()
            .mapToLong(WeeklyReportDto.DaySlot::getTotalSeconds)
            .average().orElse(0) / 3600.0;

        return WeeklyReportDto.builder()
            .totalScreenTimeSeconds(totalSeconds)
            .totalScreenTimeFormatted(formatSeconds(totalSeconds))
            .avgDailyHours(Math.round(avgDailyHours * 10.0) / 10.0)
            .days(days)
            .build();
    }

    // ── Monthly report — 30 days ───────────────────────────────────────────────
    public WeeklyReportDto getMonthlyReport(UUID deviceId, LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(29);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = endDate.plusDays(1).atStartOfDay();

        List<ActivityLog> logs = activityRepo
            .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, start, end);

        Map<LocalDate, List<ActivityLog>> byDate = logs.stream()
            .collect(Collectors.groupingBy(l -> l.getStartedAt().toLocalDate()));

        List<WeeklyReportDto.DaySlot> days = new ArrayList<>();
        long totalSeconds = 0;

        for (int i = 0; i < 30; i++) {
            LocalDate date = startDate.plusDays(i);
            List<ActivityLog> dayLogs = byDate.getOrDefault(date, List.of());
            long daySecs = dayLogs.stream().mapToLong(ActivityLog::getDurationSeconds).sum();
            totalSeconds += daySecs;

            Map<String, Long> catBreakdown = dayLogs.stream()
                .collect(Collectors.groupingBy(
                    l -> l.getCategory().name(),
                    Collectors.summingLong(ActivityLog::getDurationSeconds)
                ));

            days.add(new WeeklyReportDto.DaySlot(
                date.toString(),
                date.format(DateTimeFormatter.ofPattern("MMM d")),
                daySecs,
                catBreakdown
            ));
        }

        double avg = days.stream().mapToLong(WeeklyReportDto.DaySlot::getTotalSeconds)
            .average().orElse(0) / 3600.0;

        return WeeklyReportDto.builder()
            .totalScreenTimeSeconds(totalSeconds)
            .totalScreenTimeFormatted(formatSeconds(totalSeconds))
            .avgDailyHours(Math.round(avg * 10.0) / 10.0)
            .days(days)
            .build();
    }

    // ── Top apps ───────────────────────────────────────────────────────────────
    public AppUsageDto getTopApps(UUID deviceId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = endDate.plusDays(1).atStartOfDay();

        List<ActivityLog> logs = activityRepo
            .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, start, end);

        // Group by app name
        Map<String, Long> byApp = new HashMap<>();
        Map<String, String> appCategory = new HashMap<>();
        Map<String, String> appProcessName = new HashMap<>();
        Map<String, Boolean> appBlocked = new HashMap<>();

        for (ActivityLog log : logs) {
            byApp.merge(log.getAppName(), (long) log.getDurationSeconds(), Long::sum);
            appCategory.putIfAbsent(log.getAppName(), log.getCategory().name());
            if (log.getProcessName() != null && !log.getProcessName().isEmpty()) {
                appProcessName.putIfAbsent(log.getAppName(), log.getProcessName());
            }
            if (log.isBlocked()) appBlocked.put(log.getAppName(), true);
        }

        long total = byApp.values().stream().mapToLong(Long::longValue).sum();

        List<Map.Entry<String, Long>> sorted = byApp.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .toList();

        List<AppUsageDto.AppEntry> entries = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            var e = sorted.get(i);
            entries.add(AppUsageDto.AppEntry.builder()
                .rank(i + 1)
                .appName(e.getKey())
                .processName(appProcessName.getOrDefault(e.getKey(), ""))
                .category(appCategory.getOrDefault(e.getKey(), "OTHER"))
                .durationSeconds(e.getValue())
                .durationFormatted(formatSeconds(e.getValue()))
                .percentOfTotal(total > 0 ? Math.round((e.getValue() * 100.0 / total) * 10) / 10.0 : 0)
                .blocked(appBlocked.getOrDefault(e.getKey(), false))
                .build());
        }

        return AppUsageDto.builder()
            .apps(entries)
            .totalSeconds(total)
            .build();
    }

    // ── Category breakdown ─────────────────────────────────────────────────────
    public CategoryBreakdownDto getCategoryBreakdown(UUID deviceId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = endDate.plusDays(1).atStartOfDay();

        List<ActivityLog> logs = activityRepo
            .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, start, end);

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (ActivityLog log : logs) {
            byCategory.merge(log.getCategory().name(), (long) log.getDurationSeconds(), Long::sum);
        }

        long total = byCategory.values().stream().mapToLong(Long::longValue).sum();

        List<CategoryBreakdownDto.CategoryEntry> entries = byCategory.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(e -> new CategoryBreakdownDto.CategoryEntry(
                e.getKey(),
                e.getValue(),
                formatSeconds(e.getValue()),
                total > 0 ? Math.round((e.getValue() * 100.0 / total) * 10) / 10.0 : 0,
                CATEGORY_COLORS.getOrDefault(e.getKey(), "#6B7280")
            ))
            .toList();

        return CategoryBreakdownDto.builder()
            .categories(entries)
            .totalSeconds(total)
            .build();
    }

    // ── Heatmap — 7 days x 24 hours ───────────────────────────────────────────
    public HeatmapDto getHeatmap(UUID deviceId, LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(6);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = endDate.plusDays(1).atStartOfDay();

        List<ActivityLog> logs = activityRepo
            .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, start, end);

        // Build map: date+hour -> seconds
        Map<String, Long> grid = new HashMap<>();
        for (ActivityLog log : logs) {
            String key = log.getStartedAt().toLocalDate() + "_" + log.getStartedAt().getHour();
            grid.merge(key, (long) log.getDurationSeconds(), Long::sum);
        }

        // Find max for intensity scaling
        long maxSecs = grid.values().stream().mapToLong(Long::longValue).max().orElse(1);

        List<HeatmapDto.HeatmapRow> rows = new ArrayList<>();
        for (int d = 0; d < 7; d++) {
            LocalDate date = startDate.plusDays(d);
            List<Integer> hours = new ArrayList<>();

            for (int h = 0; h < 24; h++) {
                long secs = grid.getOrDefault(date + "_" + h, 0L);
                int intensity = secs == 0 ? 0
                    : secs < maxSecs * 0.25 ? 1
                    : secs < maxSecs * 0.60 ? 2
                    : 3;
                hours.add(intensity);
            }

            rows.add(new HeatmapDto.HeatmapRow(
                date.getDayOfWeek().toString().substring(0, 3),
                date.toString(),
                hours
            ));
        }

        return HeatmapDto.builder().rows(rows).build();
    }

    // ── Export to CSV ─────────────────────────────────────────────────────────
    public String exportToCsv(UUID deviceId, String period) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        
        if ("monthly".equalsIgnoreCase(period)) {
            startDate = endDate.minusDays(29);
        } else {
            startDate = endDate.minusDays(6); // weekly
        }
        
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<ActivityLog> logs = activityRepo
            .findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(deviceId, start, end);

        StringBuilder csv = new StringBuilder();
        csv.append("Date,AppName,Category,DurationMinutes\n");

        for (ActivityLog log : logs) {
            String date = log.getStartedAt().toLocalDate().toString();
            String appName = escapeCsv(log.getAppName());
            String category = log.getCategory().name();
            int minutes = log.getDurationSeconds() / 60;
            
            csv.append(String.format("%s,%s,%s,%d\n", date, appName, category, minutes));
        }

        return csv.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ── Utility ───────────────────────────────────────────────────────────────
    private String formatSeconds(long seconds) {
        if (seconds <= 0) return "0m";
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        if (h > 0 && m > 0) return h + "h " + m + "m";
        if (h > 0) return h + "h";
        return m + "m";
    }
}
