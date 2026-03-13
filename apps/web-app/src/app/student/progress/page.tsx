'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell, Tooltip } from 'recharts'
import { TrendingUp, Target, Award, RefreshCw } from 'lucide-react'
import { studentDashboardApi, StudentDashboard } from '@/lib/studentDashboard'
import { reportsApi, AppUsage } from '@/lib/reports'
import { goalsApi, Goal } from '@/lib/goals'

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const APP_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444']

export default function ProgressPage() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null)
  const [apps, setApps]           = useState<AppUsage | null>(null)
  const [goals, setGoals]         = useState<Goal[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    studentDashboardApi.get()
      .then(async dash => {
        setDashboard(dash)
        if (dash.deviceId) {
          const [a, g] = await Promise.all([
            reportsApi.getTopApps(dash.deviceId),
            goalsApi.getForDevice(dash.deviceId),
          ])
          setApps(a)
          setGoals(g)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading progress...
      </div>
    )
  }

  const weeklyChartData = dashboard?.weeklyData.map(d => ({
    day: d.dayLabel,
    minutes: Math.round(d.screenTimeSeconds / 60),
  })) ?? []

  const topAppsData = apps?.apps.slice(0, 5).map((a, i) => ({
    name: a.appName.length > 10 ? a.appName.slice(0, 10) + '…' : a.appName,
    hours: parseFloat((a.durationSeconds / 3600).toFixed(1)),
    color: APP_COLORS[i % APP_COLORS.length],
  })) ?? []

  const goalsMetCount = goals.filter(g => g.metToday).length
  const goalsTotal    = goals.length

  return (
    <div className="p-6 space-y-6 fade-up">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Screen Time Today</div>
              <div className="text-gray-900 text-xl font-bold">
                {formatSeconds(dashboard?.stats.screenTimeSeconds ?? 0)}
              </div>
            </div>
          </div>
          <div className="text-gray-500 text-xs">{dashboard?.stats.screenTimeFormatted}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Target size={20} className="text-green-500" />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Focus Sessions Today</div>
              <div className="text-gray-900 text-xl font-bold">
                {dashboard?.stats.focusSessionsToday ?? 0}
              </div>
            </div>
          </div>
          <div className="text-gray-500 text-xs">
            {dashboard?.stats.focusMinutesToday ?? 0} minutes total
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Award size={20} className="text-amber-500" />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Focus Score</div>
              <div className="text-gray-900 text-xl font-bold">
                {dashboard?.focusScore ?? 0}
              </div>
            </div>
          </div>
          <div className="text-gray-500 text-xs">
            🔥 {dashboard?.streak ?? 0} day streak
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">
        {weeklyChartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Screen Time (min)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyChartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="minutes" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {topAppsData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Top Apps (hours)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topAppsData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {topAppsData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Goals progress */}
      {goals.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            Goals Progress <span className="text-sm font-normal text-gray-400 ml-2">
              {goalsMetCount}/{goalsTotal} met today
            </span>
          </h3>
          <div className="space-y-3">
            {goals.map(goal => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{goal.title}</span>
                  <span className={`text-xs font-medium ${goal.metToday ? 'text-green-600' : 'text-gray-500'}`}>
                    {goal.progressLabel}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(goal.progressPercent, 100)}%`, background: '#7C3AED' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {dashboard && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Insights</h3>
          <div className="space-y-3">
            {dashboard.stats.focusSessionsToday > 0 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                <TrendingUp size={18} className="text-green-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {dashboard.stats.focusSessionsToday} focus session{dashboard.stats.focusSessionsToday !== 1 ? 's' : ''} completed today
                  </div>
                  <div className="text-xs text-gray-500">
                    Total: {dashboard.stats.focusMinutesToday} minutes of focused work
                  </div>
                </div>
              </div>
            )}
            {dashboard.streak > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
                <Award size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    🔥 {dashboard.streak}-day streak!
                  </div>
                  <div className="text-xs text-gray-500">Keep up the great work!</div>
                </div>
              </div>
            )}
            {dashboard.message && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <Target size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm font-medium text-gray-800">{dashboard.message}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
