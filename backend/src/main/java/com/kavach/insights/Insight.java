package com.kavach.insights;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_insights")
@Data
public class Insight {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private String type; // SPIKE, LATE_NIGHT, UNUSUAL, WEEKEND_OVERUSE, RECOMMENDATION

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String riskLevel; // LOW, MODERATE, HIGH

    @Column(columnDefinition = "TEXT")
    private String actionSuggested;

    @Column(nullable = false)
    private Instant generatedAt;

    @Column(nullable = false)
    private boolean dismissed = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
