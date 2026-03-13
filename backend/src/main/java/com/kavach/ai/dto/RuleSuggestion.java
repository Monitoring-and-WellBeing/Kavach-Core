package com.kavach.ai.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RuleSuggestion {
    private String id;           // deterministic key for dedup
    private String reason;       // "Arjun uses YouTube for 2h after 9pm most days."
    private String suggestion;   // "Consider adding a 9pm screen time limit."
    private String ruleType;     // "APP" | "CATEGORY" | "SCHEDULE"
    private String target;       // process name or category key
    private String scheduleStart;
    private String scheduleEnd;
}
