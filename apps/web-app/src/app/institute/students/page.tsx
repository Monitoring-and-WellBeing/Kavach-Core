"use client";

import { useEffect, useState } from "react";
import { instituteDashboardApi, InstituteDevice } from "@/lib/instituteDashboard";
import { FocusScoreRing } from "@/components/student/FocusScoreRing";
import { RefreshCw, Wifi, WifiOff, Monitor, Search } from "lucide-react";

function statusColor(status: InstituteDevice["status"]) {
  switch (status) {
    case "ONLINE":     return "bg-green-100 text-green-700";
    case "FOCUS_MODE": return "bg-blue-100 text-blue-700";
    case "PAUSED":     return "bg-amber-100 text-amber-700";
    default:           return "bg-gray-100 text-gray-500";
  }
}

function riskLevel(blockedAttempts: number): "LOW" | "MODERATE" | "HIGH" {
  if (blockedAttempts >= 5) return "HIGH";
  if (blockedAttempts >= 2) return "MODERATE";
  return "LOW";
}

export default function StudentsPage() {
  const [devices, setDevices] = useState<InstituteDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    instituteDashboardApi.get()
      .then(d => setDevices(d.devices))
      .catch(err => setError(err?.response?.data?.message || "Failed to load students"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = devices.filter(d =>
    (d.assignedTo ?? d.name).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#64748B]">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading students...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header + search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Students / Devices</h1>
          <p className="text-[#64748B] text-sm mt-0.5">{devices.length} device{devices.length !== 1 ? "s" : ""} registered</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-8 pr-4 py-2 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm placeholder-[#475569] focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#64748B]">
          {search ? "No students match your search." : "No devices linked yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(device => {
            const risk = riskLevel(device.blockedAttempts);
            // Approximate focus score from screen time (inverse proportion)
            const focusScore = Math.max(10, Math.min(100,
              100 - Math.round((device.screenTimeSeconds / 3600) * 10)
            ));

            return (
              <div key={device.id}
                className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-5 flex flex-col gap-3 hover:border-blue-500/40 transition-colors">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(device.assignedTo ?? device.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {device.assignedTo ?? device.name}
                    </p>
                    <p className="text-xs text-[#64748B] truncate flex items-center gap-1">
                      <Monitor size={10} />
                      {device.name}
                    </p>
                  </div>
                </div>

                {/* Focus score ring */}
                <div className="flex justify-center">
                  <div className="scale-75 -my-2">
                    <FocusScoreRing score={focusScore} />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Screen time</span>
                    <span className="text-white font-medium">{device.screenTimeFormatted}</span>
                  </div>
                  {device.topApp && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#64748B]">Top app</span>
                      <span className="text-white font-medium truncate max-w-[100px]">{device.topApp}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Blocked attempts</span>
                    <span className={`font-medium ${device.blockedAttempts > 0 ? 'text-red-400' : 'text-white'}`}>
                      {device.blockedAttempts}
                    </span>
                  </div>
                </div>

                {/* Status + risk */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusColor(device.status)}`}>
                    {device.status === "ONLINE" || device.status === "FOCUS_MODE"
                      ? <Wifi size={10} />
                      : <WifiOff size={10} />}
                    {device.status.replace("_", " ")}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    risk === "HIGH"     ? "bg-red-500/20 text-red-400" :
                    risk === "MODERATE" ? "bg-amber-500/20 text-amber-400" :
                                         "bg-green-500/20 text-green-400"
                  }`}>
                    {risk} risk
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
