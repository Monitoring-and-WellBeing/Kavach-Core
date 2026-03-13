package com.kavach.mood.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mood_checkins")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MoodCheckin {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** 1 = very bad, 2 = bad, 3 = neutral, 4 = good, 5 = great */
    @Column(nullable = false)
    private int mood;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "checked_in_at", nullable = false)
    private Instant checkedInAt = Instant.now();
}
