package com.kavach.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MoodCheckinResponse {
    private UUID id;
    private Integer mood;
    private String moodLabel;
    private Instant checkedInAt;
    private int xpEarned;
    private String message;
}
