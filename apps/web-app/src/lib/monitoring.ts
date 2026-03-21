import { api } from './axios'

export interface MonitoringEvent {
  id: string
  deviceId: string
  deviceName: string
  processName: string
  action: string
  detail: string | null
  platform: string | null
  timestamp: string
}

export const monitoringApi = {
  getEvents: (deviceId?: string, limit = 100): Promise<MonitoringEvent[]> =>
    api
      .get<MonitoringEvent[]>('/monitoring/events', {
        params: { ...(deviceId ? { deviceId } : {}), limit },
      })
      .then(r => r.data),
}
