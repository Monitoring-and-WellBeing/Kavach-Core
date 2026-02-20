package com.kavach.blocking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ViolationRequest {
    @NotNull private UUID deviceId;
    @NotNull private UUID ruleId;
    @NotBlank private String appName;
    private String processName;
    private String windowTitle;
    private String category;
}
