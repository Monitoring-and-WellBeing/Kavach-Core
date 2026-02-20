'use client'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
         Tooltip, Cell } from 'recharts'
import { AppUsage } from '@/lib/reports'

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION:     '#3B82F6',
  GAMING:        '#EF4444',
  ENTERTAINMENT: '#F59E0B',
  SOCIAL_MEDIA:  '#8B5CF6',
  PRODUCTIVITY:  '#22C55E',
  COMMUNICATION: '#06B6D4',
  OTHER:         '#6B7280',
}

interface Props { data: AppUsage }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { appName, durationFormatted, category } = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
      <p className="font-medium text-gray-800 text-sm">{appName}</p>
      <p className="text-gray-500 text-xs">Time: {durationFormatted}</p>
      <p className="text-gray-400 text-xs capitalize">{category.toLowerCase()}</p>
    </div>
  )
}

export function TopAppsChart({ data }: Props) {
  const chartData = data.apps.slice(0, 6).map(a => ({
    ...a,
    durationMinutes: Math.round(a.durationSeconds / 60),
    fill: CATEGORY_COLORS[a.category] || '#6B7280',
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" barSize={18}
        margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
        <XAxis type="number" axisLine={false} tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={v => v >= 60 ? `${Math.floor(v/60)}h` : `${v}m`} />
        <YAxis type="category" dataKey="appName" axisLine={false} tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 13 }} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="durationMinutes" radius={[0, 6, 6, 0]}>
          {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
