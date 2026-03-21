package com.kavach.enforcement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Inbound DTO posted by the desktop agent every time it takes an enforcement
 * action (kills an app, shows an overlay, closes a browser tab, detects a
 * kill-tool).
 */
@Data
public class EnforcementEventDto {

    @NotNull
    private UUID deviceId;

    /** May be null for URL_BLOCKED and KILL_TOOL_DETECTED events */
    private UUID ruleId;

    @NotBlank
    private String processName;

    /**
     * One of: BLOCKED | OVERLAY_SHOWN | URL_BLOCKED | KILL_TOOL_DETECTED
     *       | APP_BLOCKED | FOCUS_VIOLATION | TIME_LIMIT_REACHED
     * Validated at the DB level via CHECK constraint; we keep the DTO loose
     * to avoid version-skew issues with older agents.
     */
    @NotBlank
    private String action;

    /** Optional free-text context (e.g. URL pattern that was matched) */
    private String detail;

    /** ISO-8601 timestamp from the agent; stored as-is */
    private String timestamp;

    /** Reporting platform: WINDOWS (desktop agent) or ANDROID (mobile app). */
    private String platform;
}
