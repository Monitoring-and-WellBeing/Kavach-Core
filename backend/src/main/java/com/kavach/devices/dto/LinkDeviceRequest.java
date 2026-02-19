package com.kavach.devices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LinkDeviceRequest {
    @NotBlank(message = "Device code is required")
    @Size(min = 6, max = 6, message = "Code must be exactly 6 characters")
    private String code;

    private String deviceName;      // optional — user can rename
    private String assignedTo;      // optional — student/person name
}
