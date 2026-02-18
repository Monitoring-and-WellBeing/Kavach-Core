package com.kavach.rules;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "rules")
public class Rule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "device_id")
    private UUID deviceId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // APP_LIMIT, SCHEDULE_BLOCK, CATEGORY_BLOCK, WEBSITE_BLOCK, FOCUS_MODE

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, PAUSED, SCHEDULED

    private String target;

    @Column(name = "limit_minutes")
    private Integer limitMinutes;

    @Column(name = "schedule_start")
    private String scheduleStart;

    @Column(name = "schedule_end")
    private String scheduleEnd;

    @Column(name = "schedule_days")
    private String scheduleDays; // Comma-separated: "MON,TUE,WED"

    @Column(name = "auto_block")
    private boolean autoBlock = false;

    @Column(name = "created_at")
    private Instant createdAt;
}
