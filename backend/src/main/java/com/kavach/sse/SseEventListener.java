package com.kavach.sse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;
import java.util.UUID;

/**
 * Listens for SSE domain events and forwards them to SseRegistry AFTER the
 * originating transaction has committed. This prevents phantom SSE pushes
 * reaching clients when the DB transaction later rolls back.
 *
 * Using AFTER_COMMIT means: if the transaction rolls back, the client never
 * receives a stale event. The trade-off is the event is lost on rollback —
 * acceptable because the client will refetch on the next poll cycle.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SseEventListener {

    private static final String EVENT_RULES_UPDATED = "rules_updated";

    private final SseRegistry sseRegistry;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRulesUpdated(SseEvent.RulesUpdated event) {
        Map<String, Object> payload = Map.of("ts", System.currentTimeMillis());
        if (event.deviceId() != null) {
            sseRegistry.sendToDevice(event.deviceId(), EVENT_RULES_UPDATED, payload);
        } else {
            sseRegistry.sendToTenantDevices(UUID.fromString(event.tenantId()), EVENT_RULES_UPDATED, payload);
        }
        sseRegistry.sendToTenant(UUID.fromString(event.tenantId()), EVENT_RULES_UPDATED, payload);
        log.debug("[sse] rules_updated sent to tenant={} device={}", event.tenantId(), event.deviceId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFocusStart(SseEvent.FocusStart event) {
        Map<String, Object> payload = Map.of(
            "sessionId",       event.sessionId(),
            "durationMinutes", event.durationMinutes(),
            "endsAt",          event.endsAt()
        );
        sseRegistry.sendToDevice(event.deviceId(), "focus_start", payload);
        log.debug("[sse] focus_start sent to device={}", event.deviceId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFocusEnd(SseEvent.FocusEnd event) {
        Map<String, Object> payload = Map.of(
            "sessionId", event.sessionId(),
            "reason",    event.reason()
        );
        sseRegistry.sendToDevice(event.deviceId(), "focus_end", payload);
        log.debug("[sse] focus_end sent to device={}", event.deviceId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAlertFired(SseEvent.AlertFired event) {
        sseRegistry.sendToTenant(UUID.fromString(event.tenantId()), "alert", event.payload());
        log.debug("[sse] alert sent to tenant={}", event.tenantId());
    }
}
