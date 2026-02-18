package com.kavach.devices;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "devices")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // DESKTOP, LAPTOP, TABLET, MOBILE

    @Column(nullable = false)
    private String status = "OFFLINE"; // ONLINE, OFFLINE, PAUSED, FOCUS_MODE

    @Column(name = "os_version")
    private String osVersion;

    @Column(name = "agent_version")
    private String agentVersion;

    @Column(name = "last_seen")
    private Instant lastSeen;

    @Column(name = "device_code", unique = true, nullable = false, length = 10)
    private String deviceCode;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "created_at")
    private Instant createdAt;
}
