package com.kavach.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Thread-safe registry of all active SSE connections.
 *
 * Two connection types are managed:
 *   • Tenant emitters  — web-app parent-dashboard clients (multi-tab support)
 *   • Device emitters  — desktop-agent clients (one per device)
 */
@Component
@Slf4j
public class SseRegistry {

    // web-app: tenantId → set of active emitters (multi-tab supported)
    private final Map<UUID, Set<SseEmitter>> tenantEmitters = new ConcurrentHashMap<>();

    // desktop-agent: deviceId → single active emitter
    private final Map<String, SseEmitter>    deviceEmitters  = new ConcurrentHashMap<>();

    // cross-ref for fan-out: tenantId → Set<deviceId>
    private final Map<UUID, Set<String>>     tenantDevices   = new ConcurrentHashMap<>();

    // ── Tenant (parent dashboard) ──────────────────────────────────────────────

    public SseEmitter registerTenant(UUID tenantId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        Set<SseEmitter> set = tenantEmitters.computeIfAbsent(
                tenantId, k -> new CopyOnWriteArraySet<>());
        set.add(emitter);

        Runnable cleanup = () -> {
            Set<SseEmitter> s = tenantEmitters.get(tenantId);
            if (s != null) s.remove(emitter);
            log.debug("[SSE] Tenant {} emitter removed (remaining: {})",
                    tenantId, s == null ? 0 : s.size());
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        log.info("[SSE] Tenant {} connected (active emitters: {})", tenantId, set.size());
        return emitter;
    }

    // ── Device (desktop agent) ─────────────────────────────────────────────────

    public SseEmitter registerDevice(String deviceId, UUID tenantId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        // Replace any stale connection from the same device
        SseEmitter prev = deviceEmitters.put(deviceId, emitter);
        if (prev != null) {
            try { prev.complete(); } catch (Exception ignored) {}
        }

        // Track device → tenant for fan-out
        if (tenantId != null) {
            tenantDevices.computeIfAbsent(tenantId, k -> new CopyOnWriteArraySet<>())
                         .add(deviceId);
        }

        Runnable cleanup = () -> {
            deviceEmitters.remove(deviceId, emitter);
            if (tenantId != null) {
                Set<String> devs = tenantDevices.get(tenantId);
                if (devs != null) devs.remove(deviceId);
            }
            log.debug("[SSE] Device {} disconnected", deviceId);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        log.info("[SSE] Device {} connected (tenant: {})", deviceId, tenantId);
        return emitter;
    }

    // ── Send helpers ───────────────────────────────────────────────────────────

    /** Push an event to all web-app tabs open for this tenant. */
    public void sendToTenant(UUID tenantId, String eventName, Object data) {
        Set<SseEmitter> emitters = tenantEmitters.get(tenantId);
        if (emitters == null || emitters.isEmpty()) return;

        Set<SseEmitter> dead = new HashSet<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    /** Push an event to the desktop agent for a specific device. */
    public void sendToDevice(String deviceId, String eventName, Object data) {
        SseEmitter emitter = deviceEmitters.get(deviceId);
        if (emitter == null) return;

        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (IOException e) {
            deviceEmitters.remove(deviceId, emitter);
            log.debug("[SSE] Device {} disconnected on send ({})", deviceId, e.getMessage());
        }
    }

    /** Push an event to ALL desktop agents belonging to a tenant (for ALL_DEVICES rules). */
    public void sendToTenantDevices(UUID tenantId, String eventName, Object data) {
        Set<String> devices = tenantDevices.get(tenantId);
        if (devices == null || devices.isEmpty()) return;
        for (String deviceId : new HashSet<>(devices)) { // copy to avoid CME
            sendToDevice(deviceId, eventName, data);
        }
    }

    // ── Diagnostics ────────────────────────────────────────────────────────────

    public int tenantCount()  { return tenantEmitters.size(); }
    public int deviceCount()  { return deviceEmitters.size(); }
}
