package com.kavach.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_motivation",
       uniqueConstraints = @UniqueConstraint(columnNames = {"device_id", "cache_date"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyMotivation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "cache_date", nullable = false)
    private LocalDate cacheDate;

    @PrePersist
    void prePersist() {
        if (cacheDate == null) cacheDate = LocalDate.now();
    }
}
