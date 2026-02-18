import { AlertSeverity } from "@kavach/shared-types";
import { clsx } from "clsx";

export function RiskTag({ level }: { level: AlertSeverity }) {
  const config = {
    HIGH: "bg-red-500/15 text-red-400 border-red-500/30",
    MODERATE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    LOW: "bg-green-500/15 text-green-400 border-green-500/30",
  };
  return (
    <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full border", config[level])}>
      {level === "HIGH" ? "🔴" : level === "MODERATE" ? "🟡" : "🟢"} {level}
    </span>
  );
}
