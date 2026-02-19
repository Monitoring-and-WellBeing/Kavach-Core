package com.kavach.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WeeklyReportDto {
    private long totalScreenTimeSeconds;
    private String totalScreenTimeFormatted;
    private double avgDailyHours;
    private List<DaySlot> days;

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class DaySlot {
        private String date;           // "2026-02-18"
        private String dayLabel;       // "Mon"
        private long totalSeconds;
        private Map<String, Long> byCategory; // { "GAMING": 1800, "EDUCATION": 3600 }
    }
}
