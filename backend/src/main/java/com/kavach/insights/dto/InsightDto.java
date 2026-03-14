package com.kavach.insights.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InsightDto {
    private UUID id;
    private UUID deviceId;
    private String deviceName;
    private String weeklySummary;
    private String riskLevel;
    private List<String> riskTags;
    private List<String> positiveTags;
    private List<Map<String, Object>> insights;
    private LocalDateTime generatedAt;
    private boolean fresh;   // true if < 4 hours old
}
