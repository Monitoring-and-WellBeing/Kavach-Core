package com.kavach.devices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DeviceDto {
    private UUID id;
    private String name;
    private String type;
    private String status;
    private String osVersion;
    private String agentVersion;
    private String hostname;
    private LocalDateTime lastSeen;
    private String assignedTo;
    private UUID tenantId;
    // Computed fields
    private int screenTimeToday;     // minutes — will come from activity in Feature 05
    private String lastSeenRelative; // "2 minutes ago", "1 hour ago"
}
