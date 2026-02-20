package com.kavach.focus.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class StartFocusRequest {
    @NotNull private UUID deviceId;
    private String title = "Focus Session";
    @Min(5) @Max(180)
    private int durationMinutes = 25;
}
