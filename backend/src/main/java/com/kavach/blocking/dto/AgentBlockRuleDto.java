package com.kavach.blocking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

// Lightweight version sent to desktop agent — only what it needs to enforce
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AgentBlockRuleDto {
    private UUID id;
    private String ruleType;      // APP | CATEGORY | KEYWORD
    private String target;        // process name / category / keyword
    private boolean scheduleEnabled;
    private String scheduleDays;  // "MON,TUE,WED,THU,FRI"
    private String scheduleStart; // "09:00"
    private String scheduleEnd;   // "17:00"
    private String blockMessage;
}
