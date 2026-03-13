package com.kavach.enforcement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Posted by both the desktop agent (WINDOWS) and the Android app (ANDROID)
 * every ~5 minutes to record how long the student used each app/category.
 */
@Data
public class UsageReportDto {

    @NotNull
    private UUID deviceId;

    @NotBlank
    private String appCategory;   // GAMING | SOCIAL | ENTERTAINMENT | EDUCATION | BROWSER | OTHER

    private String packageName;   // optional — specific app (e.g. com.roblox.client)

    @Min(1)
    private int durationSeconds;

    /** WINDOWS | ANDROID */
    @NotBlank
    private String platform;
}
