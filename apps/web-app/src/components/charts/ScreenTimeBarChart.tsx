"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface ScreenTimeBarChartProps {
  data: {
    day: string;
    screenTime: number;
    education: number;
    gaming: number;
    social: number;
    other: number;
  }[];
  stacked?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F1629] border border-[#1E2A45] rounded-xl p-3 text-xs shadow-xl">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="text-[#94A3B8]">{p.name}:</span>
            <span className="text-white font-medium">{p.value}m</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ScreenTimeBarChart({ data, stacked = false }: ScreenTimeBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "#64748B", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#64748B", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.floor(v / 60)}h`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1E2A45" }} />
        {stacked ? (
          <>
            <Bar dataKey="education" name="Education" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="gaming" name="Gaming" stackId="a" fill="#ef4444" />
            <Bar dataKey="social" name="Social" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="other" name="Other" stackId="a" fill="#6b7280" radius={[4, 4, 0, 0]} />
          </>
        ) : (
          <Bar dataKey="screenTime" name="Screen Time" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
