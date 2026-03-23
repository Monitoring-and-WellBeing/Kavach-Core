package com.kavach.rewards.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class RedemptionDto {
    private UUID id;
    private UUID rewardId;
    private RewardDto reward;
    private UUID studentUserId;
    private String studentName;
    private int xpSpent;
    private String status;
    private String studentNote;
    private String parentNote;
    private OffsetDateTime requestedAt;
    private String requestedAtRelative;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime fulfilledAt;
}
