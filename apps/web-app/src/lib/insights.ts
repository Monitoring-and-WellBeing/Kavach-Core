import { api } from './axios'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type InsightType = 'SPIKE' | 'POSITIVE' | 'WARNING' | 'TIP'

export interface InsightCard {
  type: InsightType
  title: string
  body: string
  icon: string
  priority: number
}

export interface DeviceInsight {
  id: string
  deviceId: string
  deviceName: string
  weeklySummary: string
  riskLevel: RiskLevel
  riskTags: string[]
  positiveTags: string[]
  insights: InsightCard[]
  generatedAt: string
  fresh: boolean
}

export const insightsApi = {
  get: (deviceId: string) =>
    api.get<DeviceInsight>(`/insights/device/${deviceId}`).then(r => r.data),

  refresh: (deviceId: string) =>
    api.post<DeviceInsight>(`/insights/device/${deviceId}/refresh`).then(r => r.data),
}
