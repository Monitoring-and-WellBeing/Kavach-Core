package com.kavach.blocking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateBlockRuleRequest {
    @NotBlank private String name;
    @NotBlank 
    @Pattern(regexp = "APP|CATEGORY|WEBSITE|KEYWORD", message = "ruleType must be one of: APP, CATEGORY, WEBSITE, KEYWORD")
    private String ruleType;
    @NotBlank private String target;
    private String appliesTo = "ALL_DEVICES";
    private UUID deviceId;
    private boolean scheduleEnabled = false;
    private String scheduleDays = "MON,TUE,WED,THU,FRI,SAT,SUN";
    private LocalTime scheduleStart;
    private LocalTime scheduleEnd;
    private boolean showMessage = true;
    private String blockMessage = "This app has been blocked by your parent/institute.";
}
