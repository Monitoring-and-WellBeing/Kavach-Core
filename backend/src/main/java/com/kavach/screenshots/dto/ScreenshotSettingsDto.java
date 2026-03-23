package com.kavach.screenshots.dto;

import lombok.*;

import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScreenshotSettingsDto {
    private boolean enabled;
    private boolean periodicEnabled;
    private int periodicIntervalMin;
    private boolean violationEnabled;
    private boolean schoolHoursOnly;
    private String schoolStart;   // "HH:MM"
    private String schoolEnd;     // "HH:MM"
    private int retentionDays;
    private boolean studentNotified;
}
