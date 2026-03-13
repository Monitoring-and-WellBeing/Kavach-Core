package com.kavach.challenges.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_challenges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyChallenge {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", insertable = false, updatable = false)
    private ChallengeTemplate template;

    @Column(name = "challenge_date", nullable = false)
    private LocalDate challengeDate = LocalDate.now();

    @Column(name = "target_value", nullable = false)
    private int targetValue;

    @Column(name = "current_value", nullable = false)
    private int currentValue = 0;

    @Column(name = "xp_reward", nullable = false)
    private int xpReward;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "completed_at")
    private Instant completedAt;
}
