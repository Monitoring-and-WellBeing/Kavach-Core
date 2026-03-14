package com.kavach.rewards.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "reward_redemptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardRedemption {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "reward_id", nullable = false)
    private UUID rewardId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "xp_spent", nullable = false)
    private int xpSpent;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RedemptionStatus status = RedemptionStatus.PENDING;

    @Column(name = "student_note", columnDefinition = "TEXT")
    private String studentNote;

    @Column(name = "parent_note", columnDefinition = "TEXT")
    private String parentNote;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private OffsetDateTime requestedAt = OffsetDateTime.now();

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "fulfilled_at")
    private OffsetDateTime fulfilledAt;
}
