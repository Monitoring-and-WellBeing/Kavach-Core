package com.kavach.devices.dto;

import lombok.Data;

@Data
public class UpdateDeviceRequest {
    private String name;
    private String assignedTo;
}
