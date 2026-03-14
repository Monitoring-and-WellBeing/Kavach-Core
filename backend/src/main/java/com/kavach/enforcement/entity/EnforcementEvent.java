package com.kavach.enforcement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "enforcement_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnforcementEvent {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "rule_id")
    private UUID ruleId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "process_name", length = 255)
    private String processName;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(length = 500)
    private String detail;

    /** WINDOWS | ANDROID — set by reporting client. */
    @Column(length = 20)
    private String platform = "WINDOWS";

    @Column(nullable = false)
    private Instant timestamp;

    @PrePersist
    public void prePersist() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }
}
