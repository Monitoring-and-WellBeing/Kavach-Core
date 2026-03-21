import {
  reportsApi,
  type WeeklyReport,
  type AppUsage,
  type CategoryBreakdown,
  type HeatmapData,
} from '@/lib/reports'

export type Period = 'weekly' | 'monthly'

export interface ReportsBundle {
  trendData: WeeklyReport
  appUsage: AppUsage
  categories: CategoryBreakdown
  heatmap: HeatmapData
}

const getDateRange = (period: Period): { startDate: string; endDate: string } => {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate =
    period === 'weekly'
      ? new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return { startDate, endDate }
}

export const reportsQueryApi = {
  async get(deviceId: string, period: Period): Promise<ReportsBundle> {
    const { startDate, endDate } = getDateRange(period)
    const [trend, apps, cats, heat] = await Promise.all([
      period === 'weekly'
        ? reportsApi.getWeekly(deviceId, endDate)
        : reportsApi.getMonthly(deviceId, endDate),
      reportsApi.getTopApps(deviceId, startDate, endDate),
      reportsApi.getCategories(deviceId, startDate, endDate),
      reportsApi.getHeatmap(deviceId, endDate),
    ])
    return {
      trendData: trend,
      appUsage: apps,
      categories: cats,
      heatmap: heat,
    }
  },
}
