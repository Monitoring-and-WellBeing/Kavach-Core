package com.kavach.focus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "focus_whitelist")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FocusWhitelist {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "process_name", nullable = false)
    private String processName;

    @Column(name = "app_name", nullable = false)
    private String appName;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
