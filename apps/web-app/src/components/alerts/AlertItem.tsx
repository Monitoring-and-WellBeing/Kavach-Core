"use client";

import { Alert, AlertSeverity, AlertType } from "@kavach/shared-types";
import { formatTime } from "@kavach/shared-utils";
import { clsx } from "clsx";
import { Shield, Moon, Zap, Activity, Clock, TriangleAlert } from "lucide-react";

interface AlertItemProps {
  alert: Alert;
  onMarkRead: (id: string) => void;
}

const severityConfig: Record<AlertSeverity, string> = {
  HIGH: "border-l-red-500 bg-red-500/5",
  MODERATE: "border-l-yellow-500 bg-yellow-500/5",
  LOW: "border-l-green-500 bg-green-500/5",
};

const typeIcons: Record<AlertType, React.ReactNode> = {
  LATE_NIGHT: <Moon className="w-4 h-4 text-purple-400" />,
  USAGE_SPIKE: <Zap className="w-4 h-4 text-yellow-400" />,
  BLOCKED_ATTEMPT: <Shield className="w-4 h-4 text-red-400" />,
  RULE_TRIGGERED: <TriangleAlert className="w-4 h-4 text-orange-400" />,
  LIMIT_REACHED: <Clock className="w-4 h-4 text-blue-400" />,
  UNUSUAL_ACTIVITY: <Activity className="w-4 h-4 text-pink-400" />,
  FOCUS_ENDED: <Clock className="w-4 h-4 text-green-400" />,
};

export function AlertItem({ alert, onMarkRead }: AlertItemProps) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 p-4 rounded-xl border-l-4 border border-[#1E2A45] transition-colors",
        severityConfig[alert.severity],
        !alert.read && "bg-opacity-100"
      )}
    >
      <div className="mt-0.5">{typeIcons[alert.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm", alert.read ? "text-[#94A3B8]" : "text-white")}>
          {alert.message}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-[#475569]">{formatTime(alert.timestamp)}</span>
          {alert.autoBlocked && (
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              Auto-blocked
            </span>
          )}
          <span
            className={clsx(
              "text-xs px-1.5 py-0.5 rounded-full font-medium",
              alert.severity === "HIGH"
                ? "bg-red-500/10 text-red-400"
                : alert.severity === "MODERATE"
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-green-500/10 text-green-400"
            )}
          >
            {alert.severity}
          </span>
        </div>
      </div>
      {!alert.read && (
        <button
          onClick={() => onMarkRead(alert.id)}
          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
        >
          Mark read
        </button>
      )}
    </div>
  );
}
