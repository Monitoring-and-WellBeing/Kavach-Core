package com.kavach.goals.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "goal_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalProgress {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "goal_id", nullable = false)
    private UUID goalId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "period_date", nullable = false)
    private LocalDate periodDate;

    @Column(name = "current_value")
    private int currentValue = 0;

    @Column(name = "target_value", nullable = false)
    private int targetValue;

    private boolean met = false;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt = LocalDateTime.now();
}
