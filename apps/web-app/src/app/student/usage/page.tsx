'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, Clock, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ScreenTimeBarChart } from '@/components/charts/ScreenTimeBarChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { studentDashboardApi } from '@/lib/studentDashboard'
import { reportsApi, WeeklyReport, CategoryBreakdown, AppUsage } from '@/lib/reports'

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function UsagePage() {
  const [weekly, setWeekly]     = useState<WeeklyReport | null>(null)
  const [cats, setCats]         = useState<CategoryBreakdown | null>(null)
  const [apps, setApps]         = useState<AppUsage | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    studentDashboardApi.get()
      .then(async dash => {
        if (!dash.deviceId) return
        const [w, c, a] = await Promise.all([
          reportsApi.getWeekly(dash.deviceId),
          reportsApi.getCategories(dash.deviceId),
          reportsApi.getTopApps(dash.deviceId),
        ])
        setWeekly(w)
        setCats(c)
        setApps(a)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Transform weekly data for ScreenTimeBarChart
  const weeklyChartData = weekly?.days.map(d => ({
    day: d.dayLabel,
    screenTime: Math.round(d.totalSeconds / 60),
    education: Math.round((d.byCategory['Education'] ?? 0) / 60),
    gaming:    Math.round((d.byCategory['Gaming'] ?? 0) / 60),
    social:    Math.round((d.byCategory['Social'] ?? 0) / 60),
    other:     Math.round(
      Object.entries(d.byCategory)
        .filter(([k]) => !['Education','Gaming','Social'].includes(k))
        .reduce((sum, [, v]) => sum + v, 0) / 60
    ),
  })) ?? []

  // Transform categories for CategoryPieChart
  const pieData = cats?.categories.map(c => ({
    name: c.category,
    value: Math.round(c.percentage),
    color: c.color,
  })) ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#64748B]">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading usage data...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Summary */}
      {weekly && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0F1629] border border-[#1E2A45] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Clock size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-[#64748B]">This Week</div>
              <div className="text-white font-bold text-lg">
                {formatSeconds(weekly.totalScreenTimeSeconds)}
              </div>
            </div>
          </div>
          <div className="bg-[#0F1629] border border-[#1E2A45] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Smartphone size={18} className="text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-[#64748B]">Avg. Daily</div>
              <div className="text-white font-bold text-lg">
                {weekly.avgDailyHours.toFixed(1)}h
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">This Week</h3>
          </CardHeader>
          <CardContent>
            {weeklyChartData.length > 0
              ? <ScreenTimeBarChart data={weeklyChartData} stacked />
              : <div className="text-[#64748B] text-sm py-8 text-center">No data available</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">App Categories</h3>
          </CardHeader>
          <CardContent>
            {pieData.length > 0
              ? <CategoryPieChart data={pieData} />
              : <div className="text-[#64748B] text-sm py-8 text-center">No data available</div>}
          </CardContent>
        </Card>
      </div>

      {/* Apps list */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">My Apps Today</h3>
        </CardHeader>
        <CardContent>
          {!apps || apps.apps.length === 0 ? (
            <div className="text-[#64748B] text-sm py-4 text-center">No app usage data</div>
          ) : (
            <div className="flex flex-col gap-2">
              {apps.apps.map((app, i) => (
                <div key={i}
                  className="flex items-center justify-between p-3 bg-[#0A0F1E] rounded-xl border border-[#1E2A45]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1E2A45] rounded-lg flex items-center justify-center text-sm text-white font-medium">
                      {app.appName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{app.appName}</p>
                      <p className="text-xs text-[#64748B]">{app.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#94A3B8]">{app.durationFormatted}</span>
                    {app.blocked && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
