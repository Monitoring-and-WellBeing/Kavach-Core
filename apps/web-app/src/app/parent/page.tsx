"use client";

import { useState } from "react";
import {
  Clock,
  Smartphone,
  Activity,
  AlertTriangle,
  Brain,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { Modal } from "@/components/ui/Modal";
import { useToast, Toast } from "@/components/ui/Toast";
import Link from "next/link";

const heatmapData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 18 }, (_, hour) => ({
    intensity:
      day === 5 || day === 6
        ? Math.floor(Math.random() * 3) + (hour > 8 && hour < 16 ? 1 : 0)
        : Math.floor(Math.random() * 2) + (hour > 7 && hour < 15 ? 1 : 0),
  }))
);

const topApps = [
  { name: "YouTube", time: 82, color: "#EF4444" },
  { name: "Instagram", time: 52, color: "#8B5CF6" },
  { name: "WhatsApp", time: 28, color: "#22C55E" },
  { name: "Chrome", time: 20, color: "#3B82F6" },
  { name: "Games", time: 18, color: "#F59E0B" },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 18 }, (_, i) => i + 6);

function HeatmapCell({ intensity }: { intensity: number }) {
  const colors = ["#E5E7EB", "#FCD34D", "#F97316", "#EF4444"];
  return (
    <div
      className="w-4 h-4 rounded-sm transition-all"
      style={{ background: colors[intensity] }}
    />
  );
}

export default function ParentDashboard() {
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [deviceCode, setDeviceCode] = useState("");
  const [limitOpen, setLimitOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleAddDevice = () => {
    if (deviceCode.length !== 6) {
      showToast("Enter a valid 6-character device code", "error");
      return;
    }
    setDeviceCode("");
    setAddDeviceOpen(false);
    showToast("Device linked successfully! 🎉", "success");
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
          <p className="font-medium text-gray-800">
            {payload[0].payload.name}
          </p>
          <p className="text-gray-500 text-sm">
            Time : {payload[0].value} min
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div>
        <h1 className="text-gray-900 text-2xl font-bold">Hi Meena 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Here&apos;s your child&apos;s digital activity summary
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#EFF6FF" }}
          >
            <Clock size={22} style={{ color: "#3B82F6" }} />
          </div>
          <div>
            <div className="text-gray-400 text-xs font-medium">
              Screen Time Today
            </div>
            <div className="text-gray-900 text-xl font-bold mt-0.5">
              4h 12m
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#F5F3FF" }}
          >
            <Smartphone size={22} style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <div className="text-gray-400 text-xs font-medium">
              Most Used App
            </div>
            <div className="text-gray-900 text-xl font-bold mt-0.5">
              YouTube
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#F0FDF4" }}
          >
            <Activity size={22} style={{ color: "#16A34A" }} />
          </div>
          <div>
            <div className="text-gray-400 text-xs font-medium">
              Focus Time
            </div>
            <div className="text-gray-900 text-xl font-bold mt-0.5">
              1h 10m
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#FFF7ED" }}
          >
            <AlertTriangle size={22} style={{ color: "#EA580C" }} />
          </div>
          <div>
            <div className="text-gray-400 text-xs font-medium">
              Alerts Triggered
            </div>
            <div className="text-gray-900 text-xl font-bold mt-0.5">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">
            Top Apps by Time Today
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topApps} layout="vertical" barSize={20}>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 13 }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="time" radius={[0, 6, 6, 0]}>
                {topApps.map((app, i) => (
                  <Cell key={i} fill={app.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            Activity Heatmap (This Week)
          </h3>
          <div className="overflow-x-auto">
            <div className="flex gap-0.5">
              <div className="flex flex-col gap-0.5 mr-1">
                <div className="h-4 w-8" />
                {days.map((d) => (
                  <div
                    key={d}
                    className="h-4 w-8 text-gray-400 text-xs flex items-center"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {heatmapData[0].map((_, hourIdx) => (
                <div key={hourIdx} className="flex flex-col gap-0.5">
                  <div className="h-4 w-4 text-gray-300 text-[10px] flex items-center justify-center">
                    {hourIdx % 3 === 0 ? hours[hourIdx] : ""}
                  </div>
                  {heatmapData.map((dayData, dayIdx) => (
                    <HeatmapCell
                      key={dayIdx}
                      intensity={dayData[hourIdx]?.intensity ?? 0}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-gray-400 text-xs">Low</span>
            <div className="w-3 h-3 rounded-sm bg-gray-200" />
            <div className="w-3 h-3 rounded-sm bg-amber-300" />
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-gray-400 text-xs">High</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div
          className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border-l-4"
          style={{ borderLeftColor: "#7C3AED" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#F5F3FF" }}
            >
              <Brain size={18} style={{ color: "#7C3AED" }} />
            </div>
            <h3 className="font-semibold text-gray-900">AI Summary</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Screen time is up{" "}
            <span className="text-green-600 font-semibold">27% today</span>{" "}
            compared to the weekly average. YouTube usage peaked between 3–5
            PM. Consider enabling{" "}
            <span className="font-semibold text-gray-800">
              Wind-Down Mode at 9 PM
            </span>{" "}
            to help Aarav transition to bedtime.
          </p>
          <Link
            href="/parent/insights"
            className="mt-3 inline-flex items-center gap-1 text-blue-500 text-sm font-medium hover:text-blue-600"
          >
            View AI Suggestions <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setLimitOpen(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all group"
          >
            <span className="font-medium text-gray-700">Set App Limit</span>
            <ArrowUpRight
              size={16}
              className="text-gray-400 group-hover:text-gray-600"
            />
          </button>
          <button
            onClick={() => setAddDeviceOpen(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all group"
          >
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <Plus size={16} className="text-gray-400" /> Add Device
            </span>
            <ArrowUpRight
              size={16}
              className="text-gray-400 group-hover:text-gray-600"
            />
          </button>
          <Link
            href="/parent/insights"
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-medium text-sm block text-center"
            style={{
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            }}
          >
            <Brain size={16} /> View AI Suggestions
          </Link>
        </div>
      </div>

      <Modal
        open={addDeviceOpen}
        onClose={() => setAddDeviceOpen(false)}
        title="Link New Device"
      >
        <p className="text-gray-500 text-sm mb-4">
          Enter the 6-character code shown on the device after installing
          KAVACH AI agent.
        </p>
        <input
          value={deviceCode}
          onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="e.g. KV3X9A"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold text-gray-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <button
          onClick={handleAddDevice}
          className="w-full py-3 rounded-xl text-white font-medium"
          style={{ background: "#2563EB" }}
        >
          Link Device
        </button>
      </Modal>

      <Modal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        title="Set App Limit"
      >
        <div className="space-y-3">
          {["YouTube", "Instagram", "Gaming Apps", "WhatsApp"].map((app) => (
            <div
              key={app}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <span className="text-gray-700 font-medium text-sm">{app}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={60}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                />{" "}
                <span className="text-gray-400 text-xs">min/day</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setLimitOpen(false);
              showToast("App limits updated!", "success");
            }}
            className="w-full py-3 rounded-xl text-white font-medium mt-2"
            style={{ background: "#2563EB" }}
          >
            Save Limits
          </button>
        </div>
      </Modal>
    </div>
  );
}
