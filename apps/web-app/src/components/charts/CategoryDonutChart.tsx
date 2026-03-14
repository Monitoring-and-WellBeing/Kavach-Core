'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { CategoryBreakdown } from '@/lib/reports'

interface Props { data: CategoryBreakdown }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
      <p className="font-medium text-gray-800 text-sm capitalize">{d.category.toLowerCase().replace('_', ' ')}</p>
      <p className="text-gray-500 text-xs">{d.durationFormatted} — {d.percentage}%</p>
    </div>
  )
}

export function CategoryDonutChart({ data }: Props) {
  const chartData = data.categories.map(c => ({
    ...c,
    name: c.category.charAt(0) + c.category.slice(1).toLowerCase().replace('_', ' '),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
          dataKey="durationSeconds" paddingAngle={2}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8}
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}
