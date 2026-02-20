package com.kavach.focus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FocusSessionDto {
    private UUID id;
    private UUID deviceId;
    private String deviceName;
    private String initiatedRole;
    private String title;
    private int durationMinutes;
    private LocalDateTime startedAt;
    private LocalDateTime endsAt;
    private LocalDateTime endedAt;
    private String status;
    private String endReason;
    private int remainingSeconds;   // computed: endsAt - now
    private double progressPercent; // computed: elapsed / duration
}
