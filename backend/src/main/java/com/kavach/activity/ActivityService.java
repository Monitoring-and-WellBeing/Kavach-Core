package com.kavach.activity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;

    public void saveLogs(List<ActivityLog> logs) {
        logs.forEach(log -> log.setCreatedAt(Instant.now()));
        activityRepository.saveAll(logs);
    }

    public List<ActivityLog> getDailyLogs(UUID deviceId) {
        Instant start = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.DAYS);
        return activityRepository.findByDeviceIdAndTimestampBetween(deviceId, start, end);
    }

    public List<ActivityLog> getWeeklyLogs(UUID deviceId) {
        Instant start = Instant.now().minus(7, ChronoUnit.DAYS);
        return activityRepository.findByDeviceIdAndTimestampBetween(deviceId, start, Instant.now());
    }

    public List<Map<String, Object>> getTopApps(UUID deviceId) {
        return activityRepository.findTopAppsByDeviceId(deviceId).stream()
                .map(row -> Map.of("appName", row[0], "totalMinutes", row[1]))
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getCategoryBreakdown(UUID deviceId) {
        return activityRepository.findCategoryBreakdownByDeviceId(deviceId).stream()
                .map(row -> Map.of("category", row[0], "totalMinutes", row[1]))
                .collect(Collectors.toList());
    }
}
