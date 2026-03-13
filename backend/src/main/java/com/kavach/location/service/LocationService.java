package com.kavach.location.service;

import com.kavach.alerts.service.AlertEvaluationService;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.location.dto.*;
import com.kavach.location.entity.DeviceLocation;
import com.kavach.location.entity.GeoFence;
import com.kavach.location.entity.GeoFenceEvent;
import com.kavach.location.repository.DeviceLocationRepository;
import com.kavach.location.repository.GeoFenceEventRepository;
import com.kavach.location.repository.GeoFenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final DeviceLocationRepository locationRepo;
    private final GeoFenceRepository fenceRepo;
    private final GeoFenceEventRepository fenceEventRepo;
    private final DeviceRepository deviceRepo;
    private final AlertEvaluationService alertService;

    // ── Single location update ─────────────────────────────────────────────────

    @Transactional
    public void saveLocation(LocationUpdateRequest req) {
        UUID deviceId = req.getDeviceId();
        var device = deviceRepo.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        DeviceLocation loc = DeviceLocation.builder()
                .deviceId(deviceId)
                .tenantId(device.getTenantId())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .accuracy(req.getAccuracy())
                .speed(req.getSpeed())
                .altitude(req.getAltitude())
                .recordedAt(Instant.parse(req.getTimestamp()))
                .syncedAt(Instant.now())
                .build();

        locationRepo.save(loc);
        log.debug("[location] Saved fix for device {} at ({}, {})",
                deviceId, req.getLatitude(), req.getLongitude());
    }

    // ── Batch upload (offline queue flush) ────────────────────────────────────

    @Transactional
    public int saveBatch(LocationBatchRequest req) {
        int count = 0;
        for (LocationUpdateRequest item : req.getLocations()) {
            try {
                saveLocation(item);
                count++;
            } catch (Exception e) {
                log.warn("[location] Skipped bad batch item: {}", e.getMessage());
            }
        }
        return count;
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    public Optional<LocationDto> getCurrentLocation(UUID deviceId) {
        return locationRepo.findTopByDeviceIdOrderByRecordedAtDesc(deviceId)
                .map(this::toDto);
    }

    public List<LocationDto> getHistory(UUID deviceId) {
        Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
        return locationRepo.findRecentByDeviceId(deviceId, since)
                .stream()
                .map(this::toDto)
                .toList();
    }

    // ── Geo-fences ─────────────────────────────────────────────────────────────

    public List<GeoFenceDto> getFencesForDevice(UUID deviceId) {
        var device = deviceRepo.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));
        return fenceRepo.findByTenantIdAndActiveTrue(device.getTenantId())
                .stream()
                .map(this::toFenceDto)
                .toList();
    }

    @Transactional
    public void handleFenceEvent(GeoFenceEventRequest req) {
        UUID deviceId = req.getDeviceId();
        var device = deviceRepo.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        // Try to resolve the fence UUID from the regionId string
        UUID fenceId = null;
        try {
            fenceId = UUID.fromString(req.getRegionId());
        } catch (IllegalArgumentException ignored) {
            // regionId is not a UUID — store event without a FK
        }

        GeoFenceEvent event = GeoFenceEvent.builder()
                .deviceId(deviceId)
                .fenceId(fenceId)
                .regionId(req.getRegionId())
                .eventType(req.getEvent().toUpperCase())
                .occurredAt(Instant.parse(req.getTimestamp()))
                .build();

        fenceEventRepo.save(event);

        // Fire an alert to the parent
        String regionLabel = req.getRegionName() != null ? req.getRegionName() : req.getRegionId();
        alertService.triggerGeoFenceAlert(
                device.getTenantId(),
                deviceId,
                regionLabel,
                req.getEvent().toUpperCase(),
                device.getName()
        );

        log.info("[geofence] Device {} {} region '{}'",
                device.getName(), req.getEvent(), regionLabel);
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    private LocationDto toDto(DeviceLocation l) {
        return LocationDto.builder()
                .latitude(l.getLatitude())
                .longitude(l.getLongitude())
                .accuracy(l.getAccuracy())
                .speed(l.getSpeed())
                .altitude(l.getAltitude())
                .recordedAt(l.getRecordedAt().toString())
                .syncedAt(l.getSyncedAt().toString())
                .build();
    }

    private GeoFenceDto toFenceDto(GeoFence f) {
        return GeoFenceDto.builder()
                .id(f.getId())
                .name(f.getName())
                .latitude(f.getLatitude())
                .longitude(f.getLongitude())
                .radius(f.getRadiusMeters())
                .type(f.getFenceType())
                .build();
    }
}
