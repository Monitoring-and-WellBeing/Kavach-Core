package com.kavach.challenges.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StreakDto {
    private int currentStreak;
    private int longestStreak;
    private int recoveryTokens;
    /** Last 7 days: true = had focus session that day */
    private List<Boolean> last7Days;
    /** Day labels: Mon, Tue, Wed... */
    private List<String> dayLabels;
    private boolean streakBroken;
}
