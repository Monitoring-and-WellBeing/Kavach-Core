package com.kavach.tasks;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Data
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private String label;

    @Column
    private LocalTime scheduledTime;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column
    private Instant completedAt;
}
