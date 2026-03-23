package com.kavach.enforcement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** Per-rule time limit status returned to clients in the unified enforcement state. */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimeLimitEntryDto {
    private UUID    ruleId;
    private String  appCategory;
    private String  packageName;
    private int     dailyLimitSeconds;
    private int     usedSeconds;
    private int     remainingSeconds;
    private boolean limitReached;
    private boolean warningThreshold;
}
