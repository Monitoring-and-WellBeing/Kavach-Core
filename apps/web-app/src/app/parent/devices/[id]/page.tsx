"use client";

import { useParams } from "next/navigation";
import { useDevices } from "@/hooks/useDevices";
import { useRules } from "@/hooks/useRules";
import { useAlerts } from "@/hooks/useAlerts";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { QuickActions } from "@/components/devices/QuickActions";
import { RuleCard } from "@/components/rules/RuleCard";
import { AlertItem } from "@/components/alerts/AlertItem";
import { ScreenTimeBarChart } from "@/components/charts/ScreenTimeBarChart";
import { AppUsageTimeline } from "@/components/charts/AppUsageTimeline";
import { formatMinutes } from "@kavach/shared-utils";
import { mockAppUsage, mockWeeklyData } from "@/mock/activity";
import { Monitor, Clock, Laptop, Wifi } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "apps", label: "App Usage" },
  { id: "rules", label: "Rules" },
  { id: "alerts", label: "Alerts" },
];

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getDevice, pauseDevice, resumeDevice, setFocusMode } = useDevices();
  const { rules, toggleRule, deleteRule } = useRules();
  const { alerts, markRead } = useAlerts();

  const device = getDevice(id);
  if (!device) {
    return (
      <div className="text-center py-20 text-[#64748B]">
        Device not found.
      </div>
    );
  }

  const deviceApps = mockAppUsage.filter((a) => a.deviceId === device.id);
  const deviceAlerts = alerts.filter((a) => a.deviceId === device.id);
  const deviceRules = rules.filter((r) => !r.deviceId || r.deviceId === device.id);

  return (
    <div className="flex flex-col gap-6">
      {/* Device Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1E2A45] rounded-2xl flex items-center justify-center">
            {device.type === "LAPTOP" ? (
              <Laptop className="w-7 h-7 text-[#94A3B8]" />
            ) : (
              <Monitor className="w-7 h-7 text-[#94A3B8]" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{device.name}</h1>
            <p className="text-[#64748B]">{device.assignedTo} · {device.osVersion}</p>
            <div className="flex items-center gap-3 mt-2">
              <DeviceStatusBadge status={device.status} />
              <span className="text-xs text-[#64748B] font-mono">Code: {device.deviceCode}</span>
            </div>
          </div>
        </div>
        <QuickActions
          device={device}
          onPause={pauseDevice}
          onResume={resumeDevice}
          onFocus={setFocusMode}
        />
      </div>

      {/* Tabbed content */}
      <Tabs tabs={tabs}>
        {(activeTab) => (
          <>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Screen Time Today", value: formatMinutes(device.screenTimeToday), icon: <Clock className="w-4 h-4" /> },
                  { label: "Agent Version", value: `v${device.agentVersion}`, icon: <Wifi className="w-4 h-4" /> },
                  { label: "Active Rules", value: deviceRules.filter(r => r.status === "ACTIVE").length.toString(), icon: <Monitor className="w-4 h-4" /> },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="py-5 flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B]">{stat.label}</p>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="md:col-span-3">
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold text-white">Weekly Screen Time</h3>
                    </CardHeader>
                    <CardContent>
                      <ScreenTimeBarChart data={mockWeeklyData} stacked />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "apps" && (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-white">Usage Timeline Today</h3>
                  </CardHeader>
                  <CardContent>
                    <AppUsageTimeline />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-white">App Activity</h3>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-[#64748B] border-b border-[#1E2A45]">
                          <th className="pb-3">App</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Duration</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deviceApps.map((log) => (
                          <tr key={log.id} className="border-b border-[#0F1629]">
                            <td className="py-3 text-white">{log.appName}</td>
                            <td className="py-3 text-[#64748B]">{log.category}</td>
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
            )}

            {activeTab === "rules" && (
              <div className="flex flex-col gap-3">
                {deviceRules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
                ))}
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="flex flex-col gap-3">
                {deviceAlerts.length === 0 ? (
                  <p className="text-[#64748B] text-center py-8">No alerts for this device.</p>
                ) : (
                  deviceAlerts.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} onMarkRead={markRead} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
