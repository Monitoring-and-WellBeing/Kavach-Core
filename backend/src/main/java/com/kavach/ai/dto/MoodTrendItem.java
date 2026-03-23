package com.kavach.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class MoodTrendItem {
    private Instant checkedInAt;
    private Integer mood;
    private String moodLabel;
    private String dayLabel;
}
