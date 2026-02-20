package com.kavach.gamification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BadgeDto {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String icon;
    private String category;
    private String tier;
    private int xpReward;
    private boolean earned;
    private LocalDateTime earnedAt;
}
