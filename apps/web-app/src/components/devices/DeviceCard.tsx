"use client";

import { Device, DeviceStatus } from "@kavach/shared-types";
import { formatMinutes } from "@kavach/shared-utils";
import { Monitor, Laptop, Pause, Play, Focus, RefreshCw, Clock, Wifi, WifiOff } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface DeviceCardProps {
  device: Device;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onFocus: (id: string) => void;
  onSync?: (id: string) => void;
}

const statusConfig: Record<DeviceStatus, { label: string; color: string; dot: string }> = {
  ONLINE: { label: "Online", color: "text-green-400", dot: "bg-green-400" },
  OFFLINE: { label: "Offline", color: "text-gray-400", dot: "bg-gray-500" },
  PAUSED: { label: "Paused", color: "text-yellow-400", dot: "bg-yellow-400" },
  FOCUS_MODE: { label: "Focus Mode", color: "text-blue-400", dot: "bg-blue-400" },
};

export function DeviceCard({ device, onPause, onResume, onFocus, onSync }: DeviceCardProps) {
  const router = useRouter();
  const status = statusConfig[device.status];
  const Icon = device.type === "LAPTOP" ? Laptop : Monitor;

  return (
    <div
      className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-5 hover:border-blue-500/40 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E2A45] rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <div>
            <button
              onClick={() => router.push(`/parent/devices/${device.id}`)}
              className="font-semibold text-white text-sm hover:text-blue-400 transition-colors text-left"
            >
              {device.name}
            </button>
            <p className="text-xs text-[#64748B] mt-0.5">{device.assignedTo || "Unassigned"}</p>
          </div>
        </div>
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={clsx("w-2 h-2 rounded-full animate-pulse", status.dot)} />
          <span className={clsx("text-xs font-medium", status.color)}>{status.label}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-[#1E2A45]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-xs text-[#94A3B8]">
            {formatMinutes(device.screenTimeToday)} today
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#64748B]">{device.osVersion}</span>
        </div>
      </div>

      {/* Device Code */}
      <div className="mb-4">
        <span className="text-xs text-[#64748B]">Code: </span>
        <span className="text-xs font-mono text-blue-400 font-semibold">{device.deviceCode}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {device.status === DeviceStatus.ONLINE && (
          <Button size="sm" variant="secondary" onClick={() => onPause(device.id)}>
            <Pause className="w-3 h-3" />
            Pause
          </Button>
        )}
        {device.status === DeviceStatus.PAUSED && (
          <Button size="sm" variant="secondary" onClick={() => onResume(device.id)}>
            <Play className="w-3 h-3" />
            Resume
          </Button>
        )}
        {device.status !== DeviceStatus.FOCUS_MODE && device.status !== DeviceStatus.OFFLINE && (
          <Button size="sm" variant="outline" onClick={() => onFocus(device.id)}>
            <Focus className="w-3 h-3" />
            Focus
          </Button>
        )}
        {device.status === DeviceStatus.FOCUS_MODE && (
          <Button size="sm" variant="danger" onClick={() => onResume(device.id)}>
            End Focus
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onSync?.(device.id)}>
          <RefreshCw className="w-3 h-3" />
          Sync
        </Button>
      </div>
    </div>
  );
}
