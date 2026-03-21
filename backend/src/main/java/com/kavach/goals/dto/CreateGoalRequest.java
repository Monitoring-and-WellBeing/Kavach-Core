package com.kavach.goals.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateGoalRequest {
    @NotNull
    private UUID deviceId;

    @NotBlank
    private String title;

    @NotBlank
    @Pattern(regexp = "SCREEN_TIME|FOCUS_SESSIONS|APP_LIMIT|CATEGORY_LIMIT|STREAK|CUSTOM", 
             message = "goalType must be one of: SCREEN_TIME, FOCUS_SESSIONS, APP_LIMIT, CATEGORY_LIMIT, STREAK, CUSTOM")
    private String goalType;

    @NotBlank
    @Pattern(regexp = "DAILY|WEEKLY|MONTHLY", message = "period must be one of: DAILY, WEEKLY, MONTHLY")
    private String period;

    @Min(1)
    @Max(1440)
    private int targetValue;
}
