import { useState, useEffect, useCallback } from 'react'
import { reportsApi, WeeklyReport, AppUsage, CategoryBreakdown, HeatmapData } from '@/lib/reports'

type Period = 'weekly' | 'monthly'

export function useReports(deviceId: string | null, period: Period = 'weekly') {
  const [trendData, setTrendData]       = useState<WeeklyReport | null>(null)
  const [appUsage, setAppUsage]         = useState<AppUsage | null>(null)
  const [categories, setCategories]     = useState<CategoryBreakdown | null>(null)
  const [heatmap, setHeatmap]           = useState<HeatmapData | null>(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!deviceId) return
    setLoading(true)
    setError(null)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = period === 'weekly' 
        ? new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [trend, apps, cats, heat] = await Promise.all([
        period === 'weekly'
          ? reportsApi.getWeekly(deviceId, endDate)
          : reportsApi.getMonthly(deviceId, endDate),
        reportsApi.getTopApps(deviceId, startDate, endDate),
        reportsApi.getCategories(deviceId, startDate, endDate),
        reportsApi.getHeatmap(deviceId, endDate),
      ])
      setTrendData(trend)
      setAppUsage(apps)
      setCategories(cats)
      setHeatmap(heat)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [deviceId, period])

  useEffect(() => { fetch() }, [fetch])

  return { trendData, appUsage, categories, heatmap, loading, error, refetch: fetch }
}
