package com.kavach.rewards.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "rewards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reward {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RewardCategory category;

    @Column(name = "xp_cost", nullable = false)
    private int xpCost;

    @Column(length = 10)
    private String icon = "🎁";

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
