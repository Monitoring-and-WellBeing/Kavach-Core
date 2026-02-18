"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface WeeklyTrendLineProps {
  data: {
    day: string;
    screenTime: number;
    education: number;
    gaming: number;
  }[];
}

export function WeeklyTrendLine({ data }: WeeklyTrendLineProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
        <Tooltip
          contentStyle={{
            background: "#0F1629",
            border: "1px solid #1E2A45",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#fff" }}
        />
        <Legend wrapperStyle={{ fontSize: "12px", color: "#64748B" }} />
        <Line
          type="monotone"
          dataKey="screenTime"
          name="Total"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="education"
          name="Education"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="gaming"
          name="Gaming"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
