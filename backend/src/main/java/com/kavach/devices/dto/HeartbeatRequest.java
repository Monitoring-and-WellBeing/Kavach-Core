package com.kavach.devices.dto;

import lombok.Data;

@Data
public class HeartbeatRequest {
    private String agentVersion;
    private String osVersion;
    private String hostname;
}
