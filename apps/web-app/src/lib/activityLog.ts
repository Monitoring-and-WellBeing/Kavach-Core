import { api } from './axios'

export interface ActivityLogEntry {
  id: string
  deviceId: string
  deviceName: string
  appName: string
  processName: string | null
  windowTitle: string | null
  category: string
  durationSeconds: number
  durationFormatted: string
  startedAt: string
  endedAt: string | null
  blocked: boolean
}

export const activityLogApi = {
  getLogs: (
    deviceId?: string,
    hours = 24,
    limit = 200,
  ): Promise<ActivityLogEntry[]> =>
    api
      .get<ActivityLogEntry[]>('/activity/logs', {
        params: {
          ...(deviceId ? { deviceId } : {}),
          hours,
          limit,
        },
      })
      .then(r => r.data),
}
