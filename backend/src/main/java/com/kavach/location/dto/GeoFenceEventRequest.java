package com.kavach.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Geo-fence enter/exit event sent by the mobile app.
 */
@Data
public class GeoFenceEventRequest {

    @NotNull
    private UUID deviceId;

    @NotBlank
    private String regionId;

    private String regionName;

    /** ENTERED | EXITED */
    @NotBlank
    private String event;

    @NotNull
    private String timestamp;
}
