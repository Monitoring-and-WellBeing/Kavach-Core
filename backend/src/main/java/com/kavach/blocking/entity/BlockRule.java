package com.kavach.blocking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "block_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlockRule {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(nullable = false)
    private String name;

    @Column(name = "rule_type", nullable = false)
    private String ruleType;  // APP | CATEGORY | WEBSITE | KEYWORD

    @Column(nullable = false)
    private String target;    // process name / category / domain / keyword

    @Column(name = "applies_to")
    private String appliesTo = "ALL_DEVICES";

    @Column(name = "device_id")
    private UUID deviceId;

    @Column(name = "schedule_enabled")
    private boolean scheduleEnabled = false;

    @Column(name = "schedule_days")
    private String scheduleDays = "MON,TUE,WED,THU,FRI,SAT,SUN";

    @Column(name = "schedule_start")
    private LocalTime scheduleStart;

    @Column(name = "schedule_end")
    private LocalTime scheduleEnd;

    @Column(name = "show_message")
    private boolean showMessage = true;

    @Column(name = "block_message")
    private String blockMessage = "This app has been blocked by your parent/institute.";

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
