package com.kavach.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Mobile app-usage payload submitted by UsageCollectorTask every 30 minutes.
 */
@Data
public class MobileUsageRequest {

    @NotNull
    private UUID deviceId;

    @NotNull
    private String collectedAt;

    @NotNull
    private String periodStart;

    @NotNull
    private String periodEnd;

    @NotEmpty
    private List<AppEntry> appUsage;

    @Data
    public static class AppEntry {
        @NotBlank
        private String packageName;

        private String appName;

        @NotNull
        private Long durationMs;

        private String lastUsed;
    }
}
