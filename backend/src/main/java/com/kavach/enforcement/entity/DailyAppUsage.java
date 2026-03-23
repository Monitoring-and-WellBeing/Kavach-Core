package com.kavach.enforcement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Accumulates per-device daily app usage reported by both the desktop agent
 * (Windows) and the Android app.  Used by TimeLimitService to check whether
 * a student has exceeded their daily category/app allowance.
 */
@Entity
@Table(name = "daily_app_usage")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyAppUsage {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "app_category", nullable = false, length = 50)
    private String appCategory;

    @Column(name = "package_name", length = 255)
    private String packageName;

    @Builder.Default
    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds = 0;

    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated;

    @PrePersist
    public void prePersist() {
        if (this.usageDate == null) this.usageDate = LocalDate.now();
        if (this.lastUpdated == null) this.lastUpdated = Instant.now();
    }
}
