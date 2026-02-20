package com.kavach.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_badges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentBadge {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "badge_id", nullable = false)
    private UUID badgeId;

    @Column(name = "earned_at")
    private LocalDateTime earnedAt = LocalDateTime.now();
}
