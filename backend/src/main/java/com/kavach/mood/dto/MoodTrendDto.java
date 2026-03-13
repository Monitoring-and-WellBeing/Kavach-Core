package com.kavach.mood.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MoodTrendDto {
    private List<MoodCheckinDto> last7Days;
    private boolean hasAlert;
    private String alertMessage;
    /** Current mood streak (consecutive days checked in) */
    private int checkinStreak;
}
