package com.kavach.focus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

// Sent to desktop agent on each poll
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AgentFocusStatusDto {
    private boolean focusActive;
    private UUID sessionId;
    private String title;
    private int remainingSeconds;
    private List<String> whitelistedProcesses; // only allowed apps
}
