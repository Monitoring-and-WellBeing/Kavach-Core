import { api } from './axios'

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

export const focusApi = {
  start: (deviceId: string, durationMinutes: number, title?: string) =>
    api.post<FocusSession>('/focus/start', { deviceId, durationMinutes, title }).then(r => r.data),

  selfStart: (deviceId: string, durationMinutes: number, title?: string) =>
    api.post<FocusSession>('/focus/self-start', { deviceId, durationMinutes, title }).then(r => r.data),

  stop: (sessionId: string) =>
    api.post<FocusSession>(`/focus/${sessionId}/stop`).then(r => r.data),

  getActive: (deviceId: string) =>
    api.get<FocusSession>(`/focus/device/${deviceId}/active`).then(r => r.data).catch(() => null),

  getHistory: (deviceId: string) =>
    api.get<FocusSession[]>(`/focus/device/${deviceId}/history`).then(r => r.data),

  getTodayStats: (deviceId: string) =>
    api.get<{ focusMinutesToday: number; sessionsToday: number }>(
      `/focus/device/${deviceId}/stats/today`
    ).then(r => r.data),

  getWhitelist: () =>
    api.get<string[]>('/focus/whitelist').then(r => r.data),
}
