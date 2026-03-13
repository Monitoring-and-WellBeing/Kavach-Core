package com.kavach.screenshots.dto;

import com.kavach.screenshots.entity.ScreenshotTrigger;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScreenshotDto {
    private UUID id;
    private UUID deviceId;
    private ScreenshotTrigger triggerType;
    private UUID ruleId;
    private String appName;
    private Integer fileSizeKb;
    private Instant capturedAt;
}
