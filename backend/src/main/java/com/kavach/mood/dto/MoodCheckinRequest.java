package com.kavach.mood.dto;

import lombok.Data;

@Data
public class MoodCheckinRequest {
    /** 1 = very bad, 2 = bad, 3 = neutral, 4 = good, 5 = great */
    private int mood;
    private String note;
}
