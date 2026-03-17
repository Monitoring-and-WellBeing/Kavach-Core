package com.kavach.screenshots.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Per-tenant screenshot configuration.
 * Primary key IS the tenantId — one row per tenant.
 * Defaults to fully OFF (opt-in privacy model).
 */
@Entity
@Table(name = "screenshot_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScreenshotSettings {

    @Id
    @Column(name = "tenant_id")
    private UUID tenantId;

    /** Master switch — parent must explicitly enable */
    @Column(nullable = false)
    private boolean enabled = false;

    @Column(name = "periodic_enabled", nullable = false)
    private boolean periodicEnabled = false;

    @Column(name = "periodic_interval_min", nullable = false)
    private int periodicIntervalMin = 5;

    @Column(name = "violation_enabled", nullable = false)
    private boolean violationEnabled = true;

    @Column(name = "school_hours_only", nullable = false)
    private boolean schoolHoursOnly = true;

    @Column(name = "school_start", nullable = false)
    private LocalTime schoolStart = LocalTime.of(8, 0);

    @Column(name = "school_end", nullable = false)
    private LocalTime schoolEnd = LocalTime.of(16, 0);

    @Column(name = "retention_days", nullable = false)
    private int retentionDays = 7;

    /** Set to true once the student has seen the disclosure dialog */
    @Column(name = "student_notified", nullable = false)
    private boolean studentNotified = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
