package com.kavach.location.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "geo_fence_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GeoFenceEvent {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "fence_id")
    private UUID fenceId;

    /** Raw identifier string sent from the mobile app (== fence UUID string). */
    @Column(name = "region_id", nullable = false, length = 100)
    private String regionId;

    /** ENTERED | EXITED */
    @Column(name = "event_type", nullable = false, length = 10)
    private String eventType;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "notified_at")
    private Instant notifiedAt;
}
