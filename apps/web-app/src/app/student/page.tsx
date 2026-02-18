"use client";

import { useState } from "react";
import {
  Zap,
  Clock,
  CheckCircle,
  Flame,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";

const weeklyData = [
  { day: "Mon", hours: 3.2 },
  { day: "Tue", hours: 4.1 },
  { day: "Wed", hours: 2.8 },
  { day: "Thu", hours: 4.8 },
  { day: "Fri", hours: 4.3 },
  { day: "Sat", hours: 6.1 },
  { day: "Sun", hours: 5.8 },
];

const subjects = [
  { name: "Math", hours: 8.5, color: "#3B82F6", pct: 90 },
  { name: "Science", hours: 6.2, color: "#22C55E", pct: 72 },
  { name: "English", hours: 4.8, color: "#F59E0B", pct: 55 },
  { name: "Coding", hours: 5.5, color: "#8B5CF6", pct: 65 },
];

const tasks = [
  { id: 1, label: "Complete Math Chapter 5", time: "10:00 AM", done: true },
  { id: 2, label: "Science Lab Report", time: "2:00 PM", done: true },
  { id: 3, label: "English Essay Draft", time: "4:00 PM", done: false },
  { id: 4, label: "Coding Practice — Arrays", time: "6:00 PM", done: false },
];

export default function StudentDashboard() {
  const [taskDone, setTaskDone] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  return (
    <div className="p-6 space-y-6 fade-up">
      <div className="grid grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #3B82F6, #2563EB)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-medium">
              Today
            </span>
          </div>
          <div className="text-4xl font-bold mb-1">78</div>
          <div className="text-blue-100 text-sm mb-3">Focus Score</div>
          <div className="flex items-center gap-1 text-xs text-blue-100">
            <TrendingUp size={12} />
            +12% from yesterday
          </div>
        </div>

        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-medium">
              Today
            </span>
          </div>
          <div className="text-4xl font-bold mb-1">3h 24m</div>
          <div className="text-purple-100 text-sm mb-3">Focused Time</div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/70 rounded-full"
              style={{ width: "68%" }}
            />
          </div>
        </div>

        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #16A34A, #15803D)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-white" />
            </div>
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-medium">
              5/8
            </span>
          </div>
          <div className="text-4xl font-bold mb-1">62.5%</div>
          <div className="text-green-100 text-sm mb-3">Task Completion</div>
          <div className="text-green-100 text-xs">3 tasks remaining</div>
        </div>

        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #EA580C, #C2410C)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame size={18} className="text-white" />
            </div>
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-medium">
              Streak
            </span>
          </div>
          <div className="text-4xl font-bold mb-1">12 Days</div>
          <div className="text-orange-100 text-sm mb-3">Current Streak</div>
          <div className="flex items-center gap-1 text-xs text-orange-100">
            🏆 Best: 18 days
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Focus Trend</h3>
              <p className="text-gray-400 text-sm">Last 7 days performance</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">32.1h</div>
              <div className="text-gray-400 text-xs">Total this week</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={32}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
              />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {weeklyData.map((_, i) => (
                  <Cell key={i} fill={i === 5 ? "#7C3AED" : "#A78BFA"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            Subject Time Distribution
          </h3>
          <div className="space-y-4">
            {subjects.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-700 text-sm font-medium">
                    {s.name}
                  </span>
                  <span className="text-gray-500 text-sm font-semibold">
                    {s.hours}h
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${s.pct}%`,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            View Learning Hub
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Today&apos;s Tasks</h3>
            <Link
              href="/student/schedule"
              className="text-blue-500 text-sm font-medium hover:text-blue-600 flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() =>
                  setTaskDone((prev) => ({
                    ...prev,
                    [task.id]: !prev[task.id],
                  }))
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    taskDone[task.id]
                      ? "bg-green-500"
                      : "border-2 border-gray-200"
                  }`}
                >
                  {taskDone[task.id] && (
                    <CheckCircle size={14} className="text-white" />
                  )}
                </div>
                <span
                  className={`flex-1 text-sm font-medium ${
                    taskDone[task.id]
                      ? "line-through text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {task.label}
                </span>
                <span className="text-gray-400 text-xs">{task.time}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          <Link
            href="/student/focus"
            className="block rounded-2xl p-4 text-white"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #7C3AED)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} />
              <span className="font-semibold">Start Focus Mode</span>
            </div>
            <p className="text-blue-100 text-xs">Block distractions</p>
          </Link>
          <Link
            href="/student/progress"
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <TrendingUp size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              View Progress
            </span>
          </Link>
          <Link
            href="/student/achievements"
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm">🏆</span>
            <span className="text-sm font-medium text-gray-700">
              Achievements
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
