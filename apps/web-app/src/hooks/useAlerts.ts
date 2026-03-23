"use client";

import { useCallback } from "react";
import { Alert, AlertType, AlertSeverity } from "@kavach/shared-types";
import { useSSE } from "@/hooks/useSSE";
import { alertsApi, AlertItem } from "@/lib/alerts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsQueryApi } from "@/lib/api/alertsApi";

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
  const queryClient = useQueryClient();
  const queryKey = ["alerts"];
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const items = await alertsQueryApi.getInitial();
      return items.map(fromApiAlert);
    },
    staleTime: 60 * 1000,
    // GAP-16 FIXED
  });

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

    queryClient.setQueryData<Alert[]>(queryKey, (prev = []) => {
      if (prev.some((a) => a.id === incoming.id)) return prev;
      return [incoming, ...prev];
    });
  }, [queryClient]);

  // GAP-16 FIXED
  useSSE("/api/v1/sse/tenant", { alert: handleSseAlert });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id: string) => {
    queryClient.setQueryData<Alert[]>(queryKey, (prev = []) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    try { await alertsApi.markRead(id); } catch { /* best-effort */ }
  }, [queryClient]);

  const markAllRead = useCallback(async () => {
    queryClient.setQueryData<Alert[]>(queryKey, (prev = []) =>
      prev.map((a) => ({ ...a, read: true }))
    );
    try { await alertsApi.markAllRead(); } catch { /* best-effort */ }
  }, [queryClient]);

  /** Merge a page of additional REST-fetched alerts without duplicating live ones. */
  const mergeHistorical = useCallback((historical: Alert[]) => {
    queryClient.setQueryData<Alert[]>(queryKey, (prev = []) => {
      const existing = new Set(prev.map((a) => a.id));
      return [...prev, ...historical.filter((a) => !existing.has(a.id))];
    });
  }, [queryClient]);

  const alerts = query.data ?? [];
  const unreadCount = alerts.filter((a) => !a.read).length;

  return { alerts, loading: query.isLoading, markRead, markAllRead, mergeHistorical, unreadCount };
}
