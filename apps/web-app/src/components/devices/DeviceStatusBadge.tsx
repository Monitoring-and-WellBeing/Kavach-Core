import { DeviceStatus } from "@kavach/shared-types";
import { clsx } from "clsx";

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
}

const config: Record<DeviceStatus, { label: string; classes: string }> = {
  ONLINE: { label: "Online", classes: "bg-green-500/15 text-green-400 border-green-500/30" },
  OFFLINE: { label: "Offline", classes: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  PAUSED: { label: "Paused", classes: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  FOCUS_MODE: { label: "Focus Mode", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const { label, classes } = config[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
        classes
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", 
        status === "ONLINE" ? "bg-green-400 animate-pulse" :
        status === "FOCUS_MODE" ? "bg-blue-400 animate-pulse" :
        status === "PAUSED" ? "bg-yellow-400" : "bg-gray-500"
      )} />
      {label}
    </span>
  );
}
