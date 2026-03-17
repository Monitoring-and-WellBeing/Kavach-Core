"use client";

import { useEffect, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(
    /\/$/,
    ""
  );

const TOKEN_KEY = "kavach_access_token";
const REFRESH_TOKEN_KEY = "kavach_refresh_token";
const LOGIN_PATH = "/login";

function clearTokensAndRedirect(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  if (!window.location.pathname.includes(LOGIN_PATH)) {
    window.location.href = LOGIN_PATH;
  }
}

/**
 * useSSE — SSE hook using fetch with Authorization header (no token in URL).
 * Uses @microsoft/fetch-event-source so the JWT is sent in the header.
 *
 * @param path     - SSE endpoint path, e.g. "/api/v1/sse/tenant"
 * @param handlers - map of SSE event name → callback(data: unknown)
 * @param enabled  - set false to skip connecting (e.g. when not logged in)
 */
export function useSSE(
  path: string,
  handlers: Record<string, (data: unknown) => void>,
  enabled = true
): void {
  const handlersRef = useRef(handlers);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clearTokensAndRedirect();
      return;
    }

    const url = `${API_BASE}${path}`;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    fetchEventSource(url, {
      signal: abortController.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      openWhenHidden: false,
      onopen(response) {
        if (
          !response.ok &&
          (response.status === 401 || response.status === 403)
        ) {
          clearTokensAndRedirect();
          throw new Error("Unauthorized");
        }
      },
      onmessage(ev) {
        const eventName = ev.event ?? "message";
        const handler = handlersRef.current[eventName];
        if (!handler) return;
        try {
          handler(JSON.parse(ev.data));
        } catch {
          handler(ev.data);
        }
      },
      onerror(err) {
        const status =
          err && typeof err === "object" && "status" in err
            ? (err as { status?: number }).status
            : undefined;
        if (status === 401 || status === 403) {
          clearTokensAndRedirect();
          throw err;
        }
        // Reconnect after 5 s for other errors (network blips, server restarts)
        reconnectTimeoutRef.current = setTimeout(connect, 5_000);
      },
    }).catch(() => {
      // Connection closed or aborted — no-op
    });
  }, [path, enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);
}
