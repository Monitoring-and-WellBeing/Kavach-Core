package com.kavach.focus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "focus_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FocusSession {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "initiated_by")
    private UUID initiatedBy;

    @Column(name = "initiated_role", nullable = false)
    private String initiatedRole = "STUDENT";

    @Column(nullable = false)
    private String title = "Focus Session";

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes = 25;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endsAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "end_reason")
    private String endReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
