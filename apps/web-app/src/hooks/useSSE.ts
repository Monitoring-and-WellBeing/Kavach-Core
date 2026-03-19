"use client";

import { useEffect, useRef, useCallback } from "react";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(
    /\/$/,
    ""
  );

/**
 * useSSE — lightweight EventSource hook with auto-reconnect.
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
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref fresh without recreating the connection on every render
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    // EventSource cannot set custom headers, so the JWT is passed as a
    // query parameter. JwtFilter accepts ?token= as a fallback for SSE.
    const jwt = localStorage.getItem("kavach_access_token");
    if (!jwt) return; // not authenticated — skip connecting
    const url = `${API_BASE}${path}?token=${encodeURIComponent(jwt)}`;
    const es = new EventSource(url);
    esRef.current = es;

    // Wire up named event listeners lazily via the ref so new callbacks work
    const forward =
      (event: string) =>
      (e: Event): void => {
        const handler = handlersRef.current[event];
        if (!handler) return;
        try {
          handler(JSON.parse((e as MessageEvent).data));
        } catch {
          handler((e as MessageEvent).data);
        }
      };

    // Register each named event the caller cares about
    Object.keys(handlers).forEach((event) => {
      es.addEventListener(event, forward(event));
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 5 s — handles network blips and server restarts
      setTimeout(connect, 5_000);
    };
  }, [path, enabled]); // handlers intentionally excluded (stable via ref)

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
