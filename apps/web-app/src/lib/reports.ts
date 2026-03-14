import { api } from './axios'

export interface DailyReport {
  date: string
  totalScreenTimeSeconds: number
  totalScreenTimeFormatted: string
  hourly: Array<{
    hour: number
    label: string
    durationSeconds: number
    intensityLevel: number
  }>
}

export interface WeeklyReport {
  totalScreenTimeSeconds: number
  totalScreenTimeFormatted: string
  avgDailyHours: number
  days: Array<{
    date: string
    dayLabel: string
    totalSeconds: number
    byCategory: Record<string, number>
  }>
}

export interface AppUsage {
  apps: Array<{
    rank: number
    appName: string
    category: string
    durationSeconds: number
    durationFormatted: string
    percentOfTotal: number
    blocked: boolean
  }>
  totalSeconds: number
}

export interface CategoryBreakdown {
  categories: Array<{
    category: string
    durationSeconds: number
    durationFormatted: string
    percentage: number
    color: string
  }>
  totalSeconds: number
}

export interface HeatmapData {
  rows: Array<{
    dayLabel: string
    date: string
    hours: number[]   // 24 values 0-3
  }>
}

export const reportsApi = {
  getDaily: (deviceId: string, date?: string) =>
    api.get<DailyReport>(`/reports/device/${deviceId}/daily`, {
      params: date ? { date } : {}
    }).then(r => r.data),

  getWeekly: (deviceId: string, endDate?: string) =>
    api.get<WeeklyReport>(`/reports/device/${deviceId}/weekly`, {
      params: endDate ? { endDate } : {}
    }).then(r => r.data),

  getMonthly: (deviceId: string, endDate?: string) =>
    api.get<WeeklyReport>(`/reports/device/${deviceId}/monthly`, {
      params: endDate ? { endDate } : {}
    }).then(r => r.data),

  getApps: (deviceId: string) =>
    api.get<AppUsage>(`/reports/apps?deviceId=${deviceId}`).then(r => r.data),

  getTopApps: (deviceId: string, startDate?: string, endDate?: string) =>
    api.get<AppUsage>(`/reports/device/${deviceId}/apps`, {
      params: { startDate, endDate }
    }).then(r => r.data),

  getCategories: (deviceId: string, startDate?: string, endDate?: string) =>
    api.get<CategoryBreakdown>(`/reports/device/${deviceId}/categories`, {
      params: { startDate, endDate }
    }).then(r => r.data),

  getHeatmap: (deviceId: string, endDate?: string) =>
    api.get<HeatmapData>(`/reports/device/${deviceId}/heatmap`, {
      params: endDate ? { endDate } : {}
    }).then(r => r.data),
}
