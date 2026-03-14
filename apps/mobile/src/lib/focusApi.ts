import { api } from './axios'

// ── Types (mirror web-app/src/lib/focus.ts) ────────────────────────────────

export interface FocusSession {
  id: string
  deviceId: string
  deviceName: string
  initiatedRole: 'PARENT' | 'INSTITUTE_ADMIN' | 'STUDENT'
  title: string
  durationMinutes: number
  startedAt: string
  endsAt: string
  endedAt?: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
  endReason?: string
  remainingSeconds: number
  progressPercent: number
}

// ── API ────────────────────────────────────────────────────────────────────────
export const focusApi = {
  /** Student self-starts a focus session */
  selfStart: (
    deviceId: string,
    durationMinutes: number,
    title?: string
  ): Promise<FocusSession> =>
    api
      .post<FocusSession>('/focus/self-start', { deviceId, durationMinutes, title })
      .then((r) => r.data),

  /** Stop / end a session early */
  stop: (sessionId: string): Promise<FocusSession> =>
    api.post<FocusSession>(`/focus/${sessionId}/stop`).then((r) => r.data),

  /** Get currently active session for a device (null if none) */
  getActive: (deviceId: string): Promise<FocusSession | null> =>
    api
      .get<FocusSession>(`/focus/device/${deviceId}/active`)
      .then((r) => r.data)
      .catch(() => null),

  /** Recent session history */
  getHistory: (deviceId: string): Promise<FocusSession[]> =>
    api
      .get<FocusSession[]>(`/focus/device/${deviceId}/history`)
      .then((r) => r.data),

  /** Today's aggregated stats */
  getTodayStats: (
    deviceId: string
  ): Promise<{ focusMinutesToday: number; sessionsToday: number }> =>
    api
      .get<{ focusMinutesToday: number; sessionsToday: number }>(
        `/focus/device/${deviceId}/stats/today`
      )
      .then((r) => r.data),
}
