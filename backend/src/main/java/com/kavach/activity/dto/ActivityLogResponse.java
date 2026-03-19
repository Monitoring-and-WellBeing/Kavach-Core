package com.kavach.activity.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponse {
    private UUID id;
    private UUID deviceId;
    private String deviceName;
    private String appName;
    private String processName;
    private String windowTitle;
    private String category;
    private int durationSeconds;
    private String durationFormatted;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private boolean blocked;
}
