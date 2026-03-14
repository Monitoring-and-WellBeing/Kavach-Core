"use client";

import { useState, useCallback, useEffect } from "react";
import { Alert, AlertType, AlertSeverity } from "@kavach/shared-types";
import { useSSE } from "@/hooks/useSSE";
import { alertsApi, AlertItem } from "@/lib/alerts";

// ── SSE payload shape from backend ────────────────────────────────────────────
interface SseAlertPayload {
  id?: string;
  title?: string;
  message?: string;
  severity?: string;
  ruleType?: string;
  deviceId?: string;
}

/** Map backend ruleType → AlertType enum */
function toAlertType(ruleType?: string): AlertType {
  switch (ruleType?.toUpperCase()) {
    case "SCREEN_TIME_EXCEEDED":
    case "USAGE_SPIKE":
      return AlertType.USAGE_SPIKE;
    case "LATE_NIGHT_ACTIVITY":
    case "LATE_NIGHT_USAGE":
      return AlertType.LATE_NIGHT;
    case "BLOCKED_APP_ATTEMPT":
      return AlertType.BLOCKED_ATTEMPT;
    case "KILL_TOOL_DETECTED":
    case "BYPASS_ATTEMPT":
    case "FOCUS_MODE_BROKEN":
      return AlertType.RULE_TRIGGERED;
    case "FOCUS_ENDED":
      return AlertType.FOCUS_ENDED;
    default:
      return AlertType.RULE_TRIGGERED;
  }
}

/** Map backend severity string → AlertSeverity enum */
function toAlertSeverity(sev?: string): AlertSeverity {
  switch (sev?.toUpperCase()) {
    case "HIGH":
    case "CRITICAL":
      return AlertSeverity.HIGH;
    case "LOW":
      return AlertSeverity.LOW;
    default:
      return AlertSeverity.MODERATE;
  }
}

/** Convert REST AlertItem → shared Alert type */
function fromApiAlert(item: AlertItem): Alert {
  return {
    id: item.id,
    deviceId: item.deviceId ?? "",
    type: toAlertType(item.ruleType),
    severity: toAlertSeverity(item.severity),
    message: item.message ?? item.title ?? "Alert",
    timestamp: item.triggeredAt,
    read: item.read,
    autoBlocked: false,
  };
}

/**
 * useAlerts — loads historical alerts from REST on mount, then receives
 * real-time updates via SSE /api/v1/sse/tenant.
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load historical alerts on mount ──────────────────────────────────────
  useEffect(() => {
    alertsApi.getAlerts(0, 50)
      .then((page) => {
        setAlerts(page.alerts.map(fromApiAlert));
      })
      .catch(() => {
        // Silently fall back to empty — SSE will still deliver new alerts
      })
      .finally(() => setLoading(false));
  }, []);

  // ── SSE: prepend incoming alert ───────────────────────────────────────────
  const handleSseAlert = useCallback((data: unknown) => {
    const p = data as SseAlertPayload;
    if (!p?.id) return;

    const incoming: Alert = {
      id: p.id,
      deviceId: p.deviceId ?? "",
      type: toAlertType(p.ruleType),
      severity: toAlertSeverity(p.severity),
      message: p.message ?? p.title ?? "New alert",
      timestamp: new Date().toISOString(),
      read: false,
      autoBlocked: false,
    };

    setAlerts((prev) => {
      if (prev.some((a) => a.id === incoming.id)) return prev;
      return [incoming, ...prev];
    });
  }, []);

  useSSE("/api/v1/sse/tenant", { alert: handleSseAlert });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    try { await alertsApi.markRead(id); } catch { /* best-effort */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    try { await alertsApi.markAllRead(); } catch { /* best-effort */ }
  }, []);

  /** Merge a page of additional REST-fetched alerts without duplicating live ones. */
  const mergeHistorical = useCallback((historical: Alert[]) => {
    setAlerts((prev) => {
      const existing = new Set(prev.map((a) => a.id));
      return [...prev, ...historical.filter((a) => !existing.has(a.id))];
    });
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return { alerts, loading, markRead, markAllRead, mergeHistorical, unreadCount };
}
