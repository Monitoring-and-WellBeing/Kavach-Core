package com.kavach.enforcement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Per-device enforcement state cache.
 * Tracks the rules_version counter — incremented every time the parent
 * changes a rule so both clients detect the change on their next 30s poll
 * and trigger a full re-fetch.
 */
@Entity
@Table(name = "enforcement_state")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnforcementState {

    @Id
    @Column(name = "device_id")
    private UUID deviceId;

    /** Monotonically increasing counter — bumped on every rule CRUD operation. */
    @Builder.Default
    @Column(name = "rules_version", nullable = false)
    private int rulesVersion = 0;

    @Builder.Default
    @Column(name = "focus_mode_active", nullable = false)
    private boolean focusModeActive = false;

    @Column(name = "focus_session_id")
    private UUID focusSessionId;

    @Column(name = "focus_ends_at")
    private Instant focusEndsAt;

    @Column(name = "last_synced")
    private Instant lastSynced;
}
