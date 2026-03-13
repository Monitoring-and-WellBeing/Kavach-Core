package com.kavach.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity(name = "AiMoodCheckin")
@Table(name = "mood_checkins")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoodCheckin {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** 1 = stressed, 2 = tired, 3 = okay, 4 = good, 5 = great */
    @Column(nullable = false)
    private Integer mood;

    @Column(name = "mood_label", length = 20)
    private String moodLabel;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "checked_in_at", nullable = false)
    private Instant checkedInAt;

    @PrePersist
    void prePersist() {
        if (checkedInAt == null) checkedInAt = Instant.now();
    }
}
