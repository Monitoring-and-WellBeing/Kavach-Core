package com.kavach.activity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityLog {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "app_name", nullable = false)
    private String appName;

    @Column(name = "process_name")
    private String processName;

    @Column(name = "window_title", length = 500)
    private String windowTitle;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)", nullable = false)
    private AppCategory category = AppCategory.OTHER;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "is_blocked")
    private boolean blocked = false;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt = LocalDateTime.now();
}
