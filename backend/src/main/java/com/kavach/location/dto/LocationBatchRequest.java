package com.kavach.location.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * Bulk upload of location points that were queued while offline.
 */
@Data
public class LocationBatchRequest {

    @NotEmpty
    @Valid
    private List<LocationUpdateRequest> locations;
}
