package com.kavach.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DailyReportDto {
    private String date;                    // "2026-02-18"
    private long totalScreenTimeSeconds;
    private String totalScreenTimeFormatted; // "4h 12m"
    private List<HourlySlot> hourly;        // 24 slots

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class HourlySlot {
        private int hour;                   // 0-23
        private String label;               // "9 AM"
        private long durationSeconds;
        private int intensityLevel;         // 0-3 for heatmap
    }
}
