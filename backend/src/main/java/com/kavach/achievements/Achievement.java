package com.kavach.achievements;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "achievements")
@Data
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private String type; // FOCUS_STREAK, REDUCED_SCREEN_TIME, HEALTHY_SLEEP, etc.

    @Column(nullable = false)
    private String label;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String icon; // emoji

    @Column(nullable = false)
    private Instant earnedAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
