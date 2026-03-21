package com.kavach.ai.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudyBuddyResponse {
    private String message;
    private String topic;
    private int remainingQuestions;
    private boolean limitReached;
}
