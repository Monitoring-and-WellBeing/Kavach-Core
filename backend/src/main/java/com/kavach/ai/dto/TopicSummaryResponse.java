package com.kavach.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TopicSummaryResponse {
    /** e.g. ["Math/Fractions", "Science/Photosynthesis"] — shown to parent */
    private List<String> topics;
    private int totalQuestionsThisWeek;
}
