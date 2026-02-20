package com.kavach.blocking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BlockRuleDto {
    private UUID id;
    private String name;
    private String ruleType;
    private String target;
    private String appliesTo;
    private UUID deviceId;
    private boolean scheduleEnabled;
    private String scheduleDays;
    private LocalTime scheduleStart;
    private LocalTime scheduleEnd;
    private boolean showMessage;
    private String blockMessage;
    private boolean active;
    private LocalDateTime createdAt;
}
