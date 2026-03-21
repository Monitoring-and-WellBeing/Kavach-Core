"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ScreenTimeBarChart } from "@/components/charts/ScreenTimeBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";
import { instituteDashboardApi, InstituteDevice } from "@/lib/instituteDashboard";
import { reportsApi, WeeklyReport, CategoryBreakdown } from "@/lib/reports";
import { Download, RefreshCw } from "lucide-react";

export default function InstituteReportsPage() {
  const addToast = useUIStore(s => s.addToast);

  const [devices, setDevices]   = useState<InstituteDevice[]>([]);
  const [weekly, setWeekly]     = useState<WeeklyReport | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown | null>(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    instituteDashboardApi.get()
      .then(async data => {
        setDevices(data.devices);
        if (data.devices.length > 0) {
          const firstId = data.devices[0].id;
          setSelectedDevice(firstId);
          await loadReports(firstId);
        }
      })
      .catch(() => addToast({ title: "Failed to load reports", type: "error" }))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async (deviceId: string) => {
    setLoading(true);
    try {
      const [w, c] = await Promise.all([
        reportsApi.getWeekly(deviceId),
        reportsApi.getCategories(deviceId),
      ]);
      setWeekly(w);
      setCategories(c);
    } catch {
      // leave stale or empty
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    await loadReports(deviceId);
  };

  const handleExport = async (format: "csv" | "pdf") => {
    if (!selectedDevice) return;
    setExporting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = typeof window !== "undefined" ? localStorage.getItem("kavach_access_token") : null;
      const res = await fetch(
        `${apiUrl}/api/v1/reports/device/${selectedDevice}/export?format=${format}&period=weekly`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kavach-report-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ title: `Report exported as ${format.toUpperCase()}!`, type: "success" });
    } catch {
      addToast({ title: "Export failed. Please try again.", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  // ── Transform API data → chart shapes ──────────────────────────────────────

  const barData = weekly?.days.map(d => ({
    day: d.dayLabel,
    screenTime: Math.round(d.totalSeconds / 60),
    education: Math.round((d.byCategory?.["EDUCATION"] ?? 0) / 60),
    gaming:    Math.round((d.byCategory?.["GAMING"] ?? 0) / 60),
    social:    Math.round((d.byCategory?.["SOCIAL_MEDIA"] ?? 0) / 60),
    other:     Math.round((d.byCategory?.["OTHER"] ?? 0) / 60),
  })) ?? [];

  const pieData = categories?.categories.map(c => ({
    name: c.category.replace(/_/g, " "),
    value: Math.round(c.durationSeconds / 60),
    color: c.color,
  })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Reports</h1>
          {devices.length > 1 && (
            <select
              value={selectedDevice ?? ""}
              onChange={e => handleDeviceChange(e.target.value)}
              className="px-3 py-1.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.assignedTo ?? d.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")} loading={exporting}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} loading={exporting}>
            <Download className="w-4 h-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      {weekly && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-4">
            <p className="text-xs text-[#64748B] mb-1">Total Screen Time (7 days)</p>
            <p className="text-2xl font-bold text-white">{weekly.totalScreenTimeFormatted}</p>
          </div>
          <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-4">
            <p className="text-xs text-[#64748B] mb-1">Avg Daily Hours</p>
            <p className="text-2xl font-bold text-white">{weekly.avgDailyHours.toFixed(1)}h</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B]">
          <RefreshCw size={20} className="animate-spin mr-2" /> Loading reports...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-white">Screen Time — 7 Days (minutes)</h3>
            </CardHeader>
            <CardContent>
              {barData.length > 0
                ? <ScreenTimeBarChart data={barData} stacked />
                : <p className="text-[#64748B] text-sm py-4 text-center">No data available</p>
              }
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-white">Category Breakdown</h3>
            </CardHeader>
            <CardContent>
              {pieData.length > 0
                ? <CategoryPieChart data={pieData} />
                : <p className="text-[#64748B] text-sm py-4 text-center">No category data available</p>
              }
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
