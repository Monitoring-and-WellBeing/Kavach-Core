package com.kavach.alerts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AlertDto {
    private UUID id;
    private String ruleType;
    private String severity;
    private String title;
    private String message;
    private Map<String, Object> metadata;
    private boolean read;
    private boolean dismissed;
    private LocalDateTime triggeredAt;
    private String triggeredAtRelative;
    private UUID deviceId;
    private String deviceName;        // joined from devices table
}
