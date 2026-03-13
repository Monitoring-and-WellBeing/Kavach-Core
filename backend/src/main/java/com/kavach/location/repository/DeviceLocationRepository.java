package com.kavach.location.repository;

import com.kavach.location.entity.DeviceLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceLocationRepository extends JpaRepository<DeviceLocation, UUID> {

    /** Most recent location fix for a device. */
    Optional<DeviceLocation> findTopByDeviceIdOrderByRecordedAtDesc(UUID deviceId);

    /** All fixes for a device in the last 24 hours. */
    @Query("SELECT l FROM DeviceLocation l WHERE l.deviceId = :deviceId AND l.recordedAt >= :since ORDER BY l.recordedAt DESC")
    List<DeviceLocation> findRecentByDeviceId(UUID deviceId, Instant since);
}
