package com.kavach.alerts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AlertsPageDto {
    private List<AlertDto> alerts;
    private long totalCount;
    private long unreadCount;
    private int page;
    private int pageSize;
    private boolean hasMore;
}
