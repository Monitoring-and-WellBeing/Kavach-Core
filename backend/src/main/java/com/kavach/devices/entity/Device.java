package com.kavach.devices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "devices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Device {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus status;

    @Column(name = "os_version")
    private String osVersion;

    @Column(name = "agent_version")
    private String agentVersion;

    private String hostname;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
