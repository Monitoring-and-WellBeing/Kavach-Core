package com.kavach.alerts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AlertRuleDto {
    private UUID id;
    private String name;
    private String ruleType;
    private Map<String, Object> config;
    private String appliesTo;
    private UUID deviceId;
    private String severity;
    private boolean active;
    private boolean notifyPush;
    private boolean notifyEmail;
    private boolean notifySms;
    private int cooldownMinutes;
    private LocalDateTime lastTriggered;
    private LocalDateTime createdAt;
}
