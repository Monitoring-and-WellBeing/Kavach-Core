"use client";

import { BadgeCard } from "@/components/student/BadgeCard";
import { GoalProgress } from "@/components/student/GoalProgress";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge, BadgeType } from "@kavach/shared-types";
import { useUIStore } from "@/store/uiStore";

const badges: (Badge & { earned: boolean })[] = [
  { id: "b1", type: BadgeType.FOCUS_STREAK, label: "Focus Streak", description: "Complete 3 focus sessions in a row", earnedAt: new Date().toISOString(), icon: "🔥", earned: true },
  { id: "b2", type: BadgeType.REDUCED_SCREEN_TIME, label: "Screen Reducer", description: "Reduce screen time by 20% in a week", earnedAt: new Date().toISOString(), icon: "📉", earned: true },
  { id: "b3", type: BadgeType.HEALTHY_SLEEP, label: "Sleep Champion", description: "No device activity after 10PM for 7 days", earnedAt: "", icon: "🌙", earned: false },
  { id: "b4", type: BadgeType.SEVEN_DAY_STREAK, label: "7-Day Streak", description: "Maintain daily focus goals for 7 consecutive days", earnedAt: "", icon: "⚡", earned: false },
  { id: "b5", type: BadgeType.CONTROLLED_USAGE, label: "Self Control", description: "Stay under gaming limit for 14 days straight", earnedAt: "", icon: "🎯", earned: false },
];

export default function AchievementsPage() {
  const addToast = useUIStore((s) => s.addToast);

  const handleShare = (badge: Badge) => {
    addToast({ title: "Copied!", description: `Badge "${badge.label}" link copied.`, type: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Your Achievements 🏆</h2>
        <p className="text-[#64748B] text-sm mt-1">Keep improving to earn more badges!</p>
      </div>

      {/* Earned Badges */}
      <div>
        <p className="text-sm font-medium text-[#94A3B8] mb-3 uppercase tracking-wide">
          Earned ({badges.filter(b => b.earned).length})
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {badges.filter(b => b.earned).map((b) => (
            <div key={b.id} className="relative group">
              <BadgeCard badge={b} earned />
              <button
                onClick={() => handleShare(b)}
                className="absolute bottom-2 right-2 text-xs text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity bg-[#0A0F1E] px-2 py-1 rounded-lg border border-[#1E2A45]"
              >
                Share
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Badges */}
      <div>
        <p className="text-sm font-medium text-[#94A3B8] mb-3 uppercase tracking-wide">
          Locked ({badges.filter(b => !b.earned).length})
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {badges.filter(b => !b.earned).map((b) => (
            <BadgeCard key={b.id} badge={b} earned={false} />
          ))}
        </div>
      </div>

      {/* Progress toward next badge */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Progress to Next Badge</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <GoalProgress label="7-Day Streak (3/7 days done)" current={3} target={7} unit="days" color="#f59e0b" />
            <GoalProgress label="Healthy Sleep (4/7 nights clean)" current={4} target={7} unit="nights" color="#8b5cf6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
