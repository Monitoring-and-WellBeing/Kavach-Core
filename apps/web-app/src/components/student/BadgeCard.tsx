import { Badge } from "@kavach/shared-types";
import { clsx } from "clsx";

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
}

export function BadgeCard({ badge, earned = true }: BadgeCardProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition-all",
        earned
          ? "bg-[#0F1629] border-[#1E2A45] hover:border-blue-500/40"
          : "bg-[#0A0F1E] border-[#1E2A45] opacity-40 grayscale"
      )}
    >
      <div className="text-4xl">{badge.icon}</div>
      <div>
        <p className={clsx("text-sm font-semibold", earned ? "text-white" : "text-[#64748B]")}>
          {badge.label}
        </p>
        <p className="text-xs text-[#475569] mt-1">{badge.description}</p>
      </div>
      {earned && (
        <span className="text-xs text-green-400 font-medium">✓ Earned</span>
      )}
    </div>
  );
}
