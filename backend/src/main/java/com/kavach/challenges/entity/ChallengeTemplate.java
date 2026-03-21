package com.kavach.challenges.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "challenge_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChallengeTemplate {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "challenge_type", nullable = false, length = 50)
    private String challengeType;

    @Column(name = "target_value", nullable = false)
    private int targetValue = 1;

    @Column(name = "xp_reward", nullable = false)
    private int xpReward = 30;

    @Column(length = 10)
    private String icon = "⚡";

    @Column(length = 10)
    private String difficulty = "EASY";

    @Column(nullable = false)
    private boolean active = true;
}
