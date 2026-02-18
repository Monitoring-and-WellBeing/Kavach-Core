'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Download, Calendar } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockWeeklyData, mockCategoryBreakdown, mockAppUsage } from '@/mock/activity'
import { formatMinutes } from '@kavach/shared-utils'

const topApps = mockAppUsage
  .sort((a, b) => b.durationMinutes - a.durationMinutes)
  .slice(0, 10)
  .map((app, i) => ({ ...app, rank: i + 1 }))

const categoryColors: Record<string, string> = {
  Education: '#3B82F6',
  Gaming: '#EF4444',
  Entertainment: '#F59E0B',
  'Social Media': '#8B5CF6',
  Productivity: '#22C55E',
  Other: '#6B7280',
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'Day' | 'Week' | 'Month'>('Week')
  const { toast, showToast, hideToast } = useToast()

  const handleExport = () => {
    showToast('Report exported!', 'success')
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
          <p className="font-medium text-gray-800">{payload[0].payload.day || payload[0].payload.name}</p>
          <p className="text-gray-500 text-sm">Time: {payload[0].value} min</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">Usage Reports</h2>
          <p className="text-gray-500 text-sm">Aarav's device usage breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['Day', 'Week', 'Month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">
        {/* Screen Time Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">Screen Time per Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockWeeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="screenTime" radius={[6, 6, 0, 0]} fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">App Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={mockCategoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {mockCategoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Apps Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Top 10 Apps</h3>
        <div className="space-y-2">
          {topApps.map(app => (
            <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-400 w-6">{app.rank}</span>
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {app.appName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{app.appName}</div>
                  <div className="text-xs text-gray-400">{app.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">{formatMinutes(app.durationMinutes)}</span>
                {app.isBlocked ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">🔒</span>
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
