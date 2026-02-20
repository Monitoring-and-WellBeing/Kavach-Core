package com.kavach.blocking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateBlockRuleRequest {
    @NotBlank private String name;
    @NotBlank private String ruleType;   // APP | CATEGORY | WEBSITE | KEYWORD
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
