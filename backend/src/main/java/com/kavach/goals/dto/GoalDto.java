package com.kavach.goals.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalDto {
    private UUID id;
    private UUID deviceId;
    private String deviceName;
    private String title;
    private String goalType;
    private String period;
    private int targetValue;
    private boolean active;
    // Today
    private int currentValue;
    private double progressPercent;
    private boolean metToday;
    private String progressLabel;
    // 7-day history
    private List<DayResult> history;

    @Data
    @AllArgsConstructor
    public static class DayResult {
        private LocalDate date;
        private String dayLabel;
        private int value;
        private int target;
        private boolean met;
    }
}
