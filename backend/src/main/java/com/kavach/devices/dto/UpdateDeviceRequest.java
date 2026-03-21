package com.kavach.devices.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDeviceRequest {
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;
    @Size(max = 100, message = "AssignedTo must be at most 100 characters")
    private String assignedTo;
}
