package com.kavach.gamification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BadgeProgressDto {
    private long totalXp;
    private long badgesEarned;
    private long badgesTotal;
    private String level;       // Beginner / Explorer / Achiever / Champion / Legend
    private int levelProgress;  // % toward next level
    private List<BadgeDto> badges;
    private List<BadgeDto> recentlyEarned;  // last 3 earned
    private Map<String, Long> byCategory;   // category -> count earned
}
