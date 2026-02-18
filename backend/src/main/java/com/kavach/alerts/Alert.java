package com.kavach.alerts;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private String type; // USAGE_SPIKE, LATE_NIGHT, BLOCKED_ATTEMPT, etc.

    @Column(nullable = false)
    private String severity; // LOW, MODERATE, HIGH

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private boolean read = false;

    @Column(name = "auto_blocked")
    private boolean autoBlocked = false;

    @Column(name = "created_at")
    private Instant createdAt;
}
