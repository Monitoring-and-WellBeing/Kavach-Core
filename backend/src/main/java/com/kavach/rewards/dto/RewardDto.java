package com.kavach.rewards.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class RewardDto {
    private UUID id;
    private String title;
    private String description;
    private String category;
    private int xpCost;
    private String icon;
    private boolean active;
    private OffsetDateTime createdAt;
}
