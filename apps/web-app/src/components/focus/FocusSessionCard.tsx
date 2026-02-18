import { FocusSession } from "@kavach/shared-types";
import { formatDate, formatMinutes } from "@kavach/shared-utils";
import { clsx } from "clsx";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface FocusSessionCardProps {
  session: FocusSession;
}

const statusConfig = {
  ACTIVE: { icon: <Clock className="w-4 h-4 text-blue-400" />, label: "Active", color: "text-blue-400" },
  ENDED: { icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, label: "Completed", color: "text-green-400" },
  INTERRUPTED: { icon: <XCircle className="w-4 h-4 text-red-400" />, label: "Interrupted", color: "text-red-400" },
};

export function FocusSessionCard({ session }: FocusSessionCardProps) {
  const config = statusConfig[session.status];
  return (
    <div className="flex items-center gap-4 p-4 bg-[#0F1629] border border-[#1E2A45] rounded-xl">
      {config.icon}
      <div className="flex-1">
        <p className="text-sm text-white">{formatDate(session.startTime)}</p>
        <p className="text-xs text-[#64748B] mt-0.5">
          {formatMinutes(session.durationMinutes)} • {session.allowedApps.length} allowed apps
        </p>
      </div>
      <span className={clsx("text-xs font-medium", config.color)}>{config.label}</span>
    </div>
  );
}
