package com.kavach.ai.dto;

import lombok.Data;

@Data
public class MoodCheckinRequest {
    private Integer mood;        // 1–5
    private String moodLabel;    // 'great','good','okay','tired','stressed'
    private String note;
    private String deviceId;
}
