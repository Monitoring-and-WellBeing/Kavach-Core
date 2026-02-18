import { AlertSeverity } from "@kavach/shared-types";
import { clsx } from "clsx";

interface AlertBadgeProps {
  severity: AlertSeverity;
}

const config: Record<AlertSeverity, { label: string; classes: string }> = {
  HIGH: { label: "High", classes: "bg-red-500/15 text-red-400 border-red-500/30" },
  MODERATE: { label: "Moderate", classes: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  LOW: { label: "Low", classes: "bg-green-500/15 text-green-400 border-green-500/30" },
};

export function AlertBadge({ severity }: AlertBadgeProps) {
  const { label, classes } = config[severity];
  return (
    <span
      className={clsx(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border",
        classes
      )}
    >
      {label}
    </span>
  );
}
