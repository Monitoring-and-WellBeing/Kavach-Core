package com.kavach.location.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Geo-fence zone returned to the mobile app so it can register monitoring.
 */
@Data
@Builder
public class GeoFenceDto {
    private UUID id;
    private String name;
    private double latitude;
    private double longitude;
    private int radius;       // metres
    private String type;      // SAFE | ALERT
}
