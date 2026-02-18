"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ScreenTimeBarChart } from "@/components/charts/ScreenTimeBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { Button } from "@/components/ui/Button";
import { mockWeeklyData, mockCategoryBreakdown } from "@/mock/activity";
import { useUIStore } from "@/store/uiStore";
import { Download } from "lucide-react";

export default function InstituteReportsPage() {
  const addToast = useUIStore(s => s.addToast);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => addToast({ title: "Report exported!", type: "success" })}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-white">Institute Screen Time (7 Days)</h3></CardHeader>
          <CardContent><ScreenTimeBarChart data={mockWeeklyData} stacked /></CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold text-white">Category Breakdown</h3></CardHeader>
          <CardContent><CategoryPieChart data={mockCategoryBreakdown} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
