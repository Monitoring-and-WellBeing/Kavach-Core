package com.kavach.blocking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blocking_violations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlockingViolation {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "rule_id")
    private UUID ruleId;

    @Column(name = "app_name", nullable = false)
    private String appName;

    @Column(name = "process_name")
    private String processName;

    @Column(name = "window_title")
    private String windowTitle;

    private String category;

    @Column(name = "attempted_at")
    private LocalDateTime attemptedAt = LocalDateTime.now();
}
