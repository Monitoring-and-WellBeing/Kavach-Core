package com.kavach.alerts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Map;
import java.util.UUID;

@Data
public class CreateRuleRequest {
    @NotBlank private String name;
    @NotBlank private String ruleType;
    @NotNull  private Map<String, Object> config;
    private String appliesTo = "ALL_DEVICES";
    private UUID deviceId;
    private String severity = "MEDIUM";
    private boolean notifyPush = true;
    private boolean notifyEmail = false;
    private boolean notifySms = false;
    private int cooldownMinutes = 60;
}
