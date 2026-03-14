package com.kavach.enforcement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Soft daily time limits per category or specific app.
 * Separate from block_rules — these trigger warnings / overlays when the
 * usage threshold is reached rather than outright blocking.
 */
@Entity
@Table(name = "time_limit_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TimeLimitRule {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** NULL means rule applies to ALL devices in the tenant. */
    @Column(name = "device_id")
    private UUID deviceId;

    @Column(name = "app_category", length = 50)
    private String appCategory;  // GAMING | SOCIAL | ENTERTAINMENT | EDUCATION

    @Column(name = "package_name", length = 255)
    private String packageName;  // overrides category if set

    @Column(name = "daily_limit_seconds", nullable = false)
    private int dailyLimitSeconds;

    /** If set, a warning is sent when usage reaches this many seconds. */
    @Column(name = "warning_at_seconds")
    private Integer warningAtSeconds;

    /** Days this rule applies (0=Sun … 6=Sat). NULL = all days. */
    @Column(name = "schedule_days", columnDefinition = "integer[]")
    private int[] scheduleDays;

    /** Only enforce within this time window on applicable days. */
    @Column(name = "schedule_start")
    private LocalTime scheduleStart;

    @Column(name = "schedule_end")
    private LocalTime scheduleEnd;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}
