"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ScreenTimeBarChart } from "@/components/charts/ScreenTimeBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { mockWeeklyData, mockCategoryBreakdown, mockAppUsage } from "@/mock/activity";
import { formatMinutes } from "@kavach/shared-utils";

export default function UsagePage() {
  const myApps = mockAppUsage.filter(a => a.deviceId === "dev-001");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">This Week</h3>
          </CardHeader>
          <CardContent>
            <ScreenTimeBarChart data={mockWeeklyData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">App Categories</h3>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={mockCategoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">My Apps Today</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {myApps.map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-[#0A0F1E] rounded-xl border border-[#1E2A45]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1E2A45] rounded-lg flex items-center justify-center text-sm">
                    {app.appName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-white">{app.appName}</p>
                    <p className="text-xs text-[#64748B]">{app.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#94A3B8]">{formatMinutes(app.durationMinutes)}</span>
                  {app.isBlocked && (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      Blocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
