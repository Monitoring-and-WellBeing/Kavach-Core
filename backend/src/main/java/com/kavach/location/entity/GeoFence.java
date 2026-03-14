package com.kavach.location.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "geo_fences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GeoFence {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "radius_meters", nullable = false)
    @Builder.Default
    private int radiusMeters = 200;

    /** SAFE — alert when child leaves; ALERT — alert when child enters */
    @Column(name = "fence_type", nullable = false, length = 20)
    @Builder.Default
    private String fenceType = "SAFE";

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
