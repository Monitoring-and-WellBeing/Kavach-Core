package com.kavach.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_ai_usage")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAiUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "topic", length = 100)
    private String topic;

    /** SHA-256 of the raw question — stored for deduplication only, never shown */
    @Column(name = "question_hash", length = 64)
    private String questionHash;

    @Column(name = "used_at", nullable = false)
    private Instant usedAt;

    @PrePersist
    void prePersist() {
        if (usedAt == null) usedAt = Instant.now();
    }
}
