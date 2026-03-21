package com.kavach.sse;

import java.util.Map;

/**
 * Domain events published inside @Transactional service methods.
 * Delivered to SseEventListener AFTER the transaction commits, preventing
 * phantom SSE pushes on rollback.
 */
public sealed interface SseEvent {

    record RulesUpdated(
        String tenantId,
        String deviceId    // null means "all devices in tenant"
    ) implements SseEvent {}

    record FocusStart(
        String deviceId,
        String sessionId,
        int durationMinutes,
        String endsAt
    ) implements SseEvent {}

    record FocusEnd(
        String deviceId,
        String sessionId,
        String reason
    ) implements SseEvent {}

    record AlertFired(
        String tenantId,
        Map<String, Object> payload
    ) implements SseEvent {}
}
