package com.kavach.monitoring;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonitoringEventResponse {
    private UUID id;
    private UUID deviceId;
    private String deviceName;
    private String processName;
    private String action;
    private String detail;
    private String platform;
    private Instant timestamp;
}
