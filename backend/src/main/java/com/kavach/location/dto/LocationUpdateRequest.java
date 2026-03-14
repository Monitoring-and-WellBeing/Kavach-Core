package com.kavach.location.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Single GPS fix sent by the mobile app (online path).
 * Also used for each item in the offline batch upload.
 */
@Data
public class LocationUpdateRequest {

    @NotNull
    private UUID deviceId;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    private Double accuracy;
    private Double speed;
    private Double altitude;

    /** ISO-8601 timestamp of when the fix was recorded on the device. */
    @NotNull
    private String timestamp;
}
