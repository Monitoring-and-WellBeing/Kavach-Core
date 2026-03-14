package com.kavach.challenges.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DailyChallengeDto {
    private UUID id;
    private String title;
    private String description;
    private String icon;
    private String challengeType;
    private String difficulty;
    private int xpReward;
    private int currentValue;
    private int targetValue;
    private boolean completed;
    private Instant completedAt;
}
