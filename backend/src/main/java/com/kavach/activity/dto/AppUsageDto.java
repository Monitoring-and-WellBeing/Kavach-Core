package com.kavach.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AppUsageDto {
    private List<AppEntry> apps;
    private long totalSeconds;

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class AppEntry {
        private int rank;
        private String appName;
        private String processName;
        private String category;
        private long durationSeconds;
        private String durationFormatted;
        private double percentOfTotal;
        private boolean blocked;
    }
}
