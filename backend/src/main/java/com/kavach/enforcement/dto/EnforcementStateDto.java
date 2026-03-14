package com.kavach.enforcement.dto;

import com.kavach.blocking.dto.AgentBlockRuleDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Unified enforcement state returned by GET /enforcement/state/{deviceId}.
 * Both the desktop agent and the Android app consume this single response to
 * know what to block, what time limits apply, and whether focus mode is active.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EnforcementStateDto {

    /** All active blocking rules for this device. */
    private List<AgentBlockRuleDto> blockingRules;

    /** Per-category/app time limit status for today. */
    private TimeLimitStatusDto timeLimitStatus;

    /** Is a focus session currently running? */
    private boolean focusModeActive;

    /** When the current focus session ends (null if no active session). */
    private LocalDateTime focusEndsAt;

    /** Apps allowed during focus mode (all others are blocked). */
    private List<String> focusWhitelist;

    /**
     * Monotonically increasing counter bumped on every rule change.
     * Clients cache this and only perform a full re-fetch when it changes,
     * saving bandwidth on the lightweight 30-second version poll.
     */
    private int rulesVersion;
}
