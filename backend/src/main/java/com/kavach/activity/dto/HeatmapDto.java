package com.kavach.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class HeatmapDto {
    private List<HeatmapRow> rows;  // 7 rows (Mon-Sun)

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class HeatmapRow {
        private String dayLabel;    // "Mon"
        private String date;        // "2026-02-17"
        private List<Integer> hours; // 24 values, each 0-3 (intensity)
    }
}
