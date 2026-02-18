"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { AlertItem } from "@/components/alerts/AlertItem";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { useAlerts } from "@/hooks/useAlerts";
import { useDevices } from "@/hooks/useDevices";
import { mockCategoryBreakdown } from "@/mock/activity";
import { DeviceStatus } from "@kavach/shared-types";
import { Monitor, Users, Bell, Shield } from "lucide-react";
import { clsx } from "clsx";

const statusColors: Record<string, string> = {
  ONLINE: "bg-green-500",
  OFFLINE: "bg-gray-600",
  PAUSED: "bg-yellow-500",
  FOCUS_MODE: "bg-blue-500",
};

export default function InstituteDashboard() {
  const { devices } = useDevices();
  const { alerts, markRead } = useAlerts();

  const onlineCount = devices.filter(d => d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.FOCUS_MODE).length;
  const criticalAlerts = alerts.filter(a => a.severity === "HIGH" && !a.read);
  const complianceScore = 78;

  const stats = [
    { label: "Total Devices", value: "48", icon: <Monitor className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Online Now", value: `${onlineCount}`, icon: <Monitor className="w-5 h-5" />, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Alerts Today", value: "12", icon: <Bell className="w-5 h-5" />, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Compliance", value: `${complianceScore}%`, icon: <Shield className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status Heatmap */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">Lab Device Status</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 48 }, (_, i) => {
                const statuses = ["ONLINE", "ONLINE", "ONLINE", "FOCUS_MODE", "OFFLINE", "PAUSED"];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                return (
                  <div
                    key={i}
                    title={`PC ${i + 1} — ${status}`}
                    className={clsx(
                      "w-6 h-6 rounded-sm cursor-pointer hover:opacity-80 transition-opacity",
                      statusColors[status]
                    )}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${color}`} />
                  <span className="text-xs text-[#64748B] capitalize">{status.toLowerCase().replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">Institute-wide App Usage</h3>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={mockCategoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Critical Alerts</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {alerts.filter(a => a.severity === "HIGH").slice(0, 5).map((a) => (
              <AlertItem key={a.id} alert={a} onMarkRead={markRead} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
