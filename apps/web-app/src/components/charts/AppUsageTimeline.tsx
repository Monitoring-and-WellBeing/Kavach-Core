"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const timelineData = [
  { time: "8 AM", usage: 0 },
  { time: "9 AM", usage: 45 },
  { time: "10 AM", usage: 60 },
  { time: "11 AM", usage: 30 },
  { time: "12 PM", usage: 20 },
  { time: "1 PM", usage: 15 },
  { time: "2 PM", usage: 50 },
  { time: "3 PM", usage: 70 },
  { time: "4 PM", usage: 65 },
  { time: "5 PM", usage: 40 },
  { time: "6 PM", usage: 90 },
  { time: "7 PM", usage: 120 },
  { time: "8 PM", usage: 100 },
  { time: "9 PM", usage: 75 },
  { time: "10 PM", usage: 30 },
];

export function AppUsageTimeline() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: "#64748B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: "#64748B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}m`}
        />
        <Tooltip
          contentStyle={{
            background: "#0F1629",
            border: "1px solid #1E2A45",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#94A3B8" }}
        />
        <Area
          type="monotone"
          dataKey="usage"
          name="Usage"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#usageGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
