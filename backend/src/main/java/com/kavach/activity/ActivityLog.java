package com.kavach.activity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "app_name")
    private String appName;

    @Column(name = "app_path")
    private String appPath;

    private String category;

    @Column(name = "duration_minutes")
    private int durationMinutes;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "is_blocked")
    private boolean isBlocked;

    @Column(name = "created_at")
    private Instant createdAt;
}
