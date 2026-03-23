package com.kavach.screenshots.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "screenshots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Screenshot {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Path / key inside the R2 bucket — e.g. tenantId/deviceId/YYYY-MM-DD/timestamp.jpg */
    @Column(name = "r2_key", nullable = false, length = 500)
    private String r2Key;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false,
            columnDefinition = "screenshot_trigger")
    private ScreenshotTrigger triggerType;

    @Column(name = "rule_id")
    private UUID ruleId;

    @Column(name = "app_name")
    private String appName;

    @Column(name = "file_size_kb")
    private Integer fileSizeKb;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
