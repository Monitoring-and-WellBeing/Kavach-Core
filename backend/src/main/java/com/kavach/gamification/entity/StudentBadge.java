package com.kavach.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "student_badges",
    uniqueConstraints = {
        // Prevents duplicate badge awards even under concurrent @Scheduled job execution
        // across multiple Railway instances. Companion DB constraint is in V28 migration.
        @UniqueConstraint(
            name = "uq_student_badges_device_badge",
            columnNames = {"device_id", "badge_id"}
        )
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentBadge {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "badge_id", nullable = false)
    private UUID badgeId;

    @Builder.Default
    @Column(name = "earned_at")
    private LocalDateTime earnedAt = LocalDateTime.now();
}
