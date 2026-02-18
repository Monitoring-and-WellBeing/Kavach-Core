"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { GoalProgress } from "@/components/student/GoalProgress";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";

const goals = [
  { label: "Daily Focus Sessions", current: 1, target: 3, unit: "sessions", color: "#3b82f6" },
  { label: "Education App Time", current: 90, target: 120, unit: "min", color: "#22c55e" },
  { label: "Gaming Under Limit", current: 15, target: 30, unit: "min", color: "#f59e0b" },
  { label: "Late Night (should be 0)", current: 0, target: 0, unit: "violations", color: "#22c55e" },
  { label: "Weekly Screen Time", current: 1500, target: 2100, unit: "min", color: "#8b5cf6" },
];

export default function GoalsPage() {
  const addToast = useUIStore(s => s.addToast);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">My Goals 🎯</h2>
        <p className="text-sm text-[#64748B] mt-1">Set by your parent to help you succeed.</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Today&apos;s Progress</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5">
            {goals.map(g => (
              <GoalProgress
                key={g.label}
                label={g.label}
                current={g.current}
                target={g.target || 1}
                unit={g.unit}
                color={g.color}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={() => addToast({ title: "Keep going! You're on track 🚀", type: "success" })}>
          Check My Progress
        </Button>
      </div>
    </div>
  );
}
