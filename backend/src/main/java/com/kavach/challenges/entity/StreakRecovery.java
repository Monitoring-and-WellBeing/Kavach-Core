package com.kavach.challenges.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "streak_recoveries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StreakRecovery {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false, unique = true)
    private UUID deviceId;

    @Column(name = "tokens_available", nullable = false)
    private int tokensAvailable = 0;

    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated = Instant.now();
}
