'use client'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
         Tooltip, CartesianGrid, Cell } from 'recharts'
import { WeeklyReport } from '@/lib/reports'

interface Props {
  data: WeeklyReport
  highlightColor?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const secs = payload[0].value as number
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
      <p className="font-medium text-gray-800 text-sm">{label}</p>
      <p className="text-gray-500 text-xs">{h > 0 ? `${h}h ${m}m` : `${m}m`}</p>
    </div>
  )
}

export function ScreenTimeTrendChart({ data, highlightColor = '#3B82F6' }: Props) {
  const maxDay = data.days.reduce((max, d) =>
    d.totalSeconds > max.totalSeconds ? d : max, data.days[0])

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data.days} barSize={28} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="dayLabel" axisLine={false} tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={v => {
            const h = Math.floor(v / 3600)
            return h > 0 ? `${h}h` : `${Math.floor(v/60)}m`
          }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="totalSeconds" radius={[6, 6, 0, 0]}>
          {data.days.map((d, i) => (
            <Cell key={i}
              fill={d.dayLabel === maxDay?.dayLabel ? highlightColor : `${highlightColor}70`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
