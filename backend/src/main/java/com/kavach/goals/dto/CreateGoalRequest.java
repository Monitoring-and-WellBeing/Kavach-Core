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
    private String goalType;

    @NotBlank
    private String period;

    @Min(1)
    @Max(1440)
    private int targetValue;
}
