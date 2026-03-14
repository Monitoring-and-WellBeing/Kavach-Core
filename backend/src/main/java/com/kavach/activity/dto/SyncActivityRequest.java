package com.kavach.activity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SyncActivityRequest {

    @NotNull(message = "deviceId is required")
    private UUID deviceId;

    @NotEmpty(message = "logs cannot be empty")
    private List<LogEntry> logs;

    @Data
    public static class LogEntry {
        @NotBlank private String appName;
        private String processName;
        private String windowTitle;
        @NotBlank private String category;
        private int durationSeconds;
        @NotBlank private String startedAt;   // ISO-8601 string from agent
        private String endedAt;
        private boolean isBlocked;
    }
}
