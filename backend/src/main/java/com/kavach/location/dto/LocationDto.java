package com.kavach.location.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Location point returned to the parent dashboard.
 */
@Data
@Builder
public class LocationDto {
    private double latitude;
    private double longitude;
    private Double accuracy;
    private Double speed;
    private Double altitude;
    private String recordedAt;   // ISO-8601
    private String syncedAt;     // ISO-8601
}
