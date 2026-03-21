package com.kavach.mood.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MoodCheckinDto {
    private int mood;
    private String note;
    private Instant checkedInAt;
    /** Day label for chart display: Mon, Tue... */
    private String dayLabel;
}
