package com.kavach.focus;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "focus_sessions")
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "allowed_apps", columnDefinition = "TEXT")
    private String allowedApps; // Comma-separated

    @Column(name = "blocked_apps", columnDefinition = "TEXT")
    private String blockedApps; // Comma-separated

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, ENDED, INTERRUPTED

    @Column(name = "initiated_by")
    private String initiatedBy; // Role name

    @Column(name = "created_at")
    private Instant createdAt;
}
