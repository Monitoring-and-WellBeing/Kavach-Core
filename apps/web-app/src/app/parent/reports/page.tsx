"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenTimeBarChart } from "@/components/charts/ScreenTimeBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { WeeklyTrendLine } from "@/components/charts/WeeklyTrendLine";
import { useUIStore } from "@/store/uiStore";
import { mockWeeklyData, mockCategoryBreakdown, mockAppUsage } from "@/mock/activity";
import { formatMinutes } from "@kavach/shared-utils";
import { Download, TrendingUp, Clock } from "lucide-react";
import { clsx } from "clsx";

type Period = "weekly" | "monthly";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const addToast = useUIStore((s) => s.addToast);

  const handleExport = () => {
    addToast({ title: "Report exported!", description: "PDF saved to your downloads.", type: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          {(["weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize",
                period === p
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-[#1E2A45] text-[#64748B] hover:text-white"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Screen Time — {period === "weekly" ? "Last 7 Days" : "Last 30 Days"}
            </h3>
          </CardHeader>
          <CardContent>
            <ScreenTimeBarChart data={mockWeeklyData} stacked />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">Category Breakdown</h3>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={mockCategoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Activity Trend
          </h3>
        </CardHeader>
        <CardContent>
          <WeeklyTrendLine data={mockWeeklyData} />
        </CardContent>
      </Card>

      {/* Top Apps Table */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Top Apps</h3>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#64748B] border-b border-[#1E2A45]">
                <th className="pb-3">#</th>
                <th className="pb-3">App Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Time Spent</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockAppUsage
                .sort((a, b) => b.durationMinutes - a.durationMinutes)
                .map((log, i) => (
                  <tr key={log.id} className="border-b border-[#1E2A45]/50 hover:bg-[#0F1629]/50">
                    <td className="py-3 text-[#64748B]">{i + 1}</td>
                    <td className="py-3 text-white font-medium">{log.appName}</td>
                    <td className="py-3">
                      <span className="text-xs text-[#64748B] bg-[#1E2A45] px-2 py-0.5 rounded-md">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 text-[#94A3B8]">{formatMinutes(log.durationMinutes)}</td>
                    <td className="py-3">
                      {log.isBlocked ? (
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Blocked</span>
                      ) : (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Allowed</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
