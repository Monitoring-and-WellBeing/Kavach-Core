"use client";

import { Pause, Play, Focus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Device, DeviceStatus } from "@kavach/shared-types";

interface QuickActionsProps {
  device: Device;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onFocus: (id: string) => void;
}

export function QuickActions({ device, onPause, onResume, onFocus }: QuickActionsProps) {
  return (
    <div className="flex gap-2">
      {device.status === DeviceStatus.ONLINE && (
        <Button size="sm" variant="secondary" onClick={() => onPause(device.id)}>
          <Pause className="w-3.5 h-3.5" />
          Pause
        </Button>
      )}
      {(device.status === DeviceStatus.PAUSED || device.status === DeviceStatus.FOCUS_MODE) && (
        <Button size="sm" variant="secondary" onClick={() => onResume(device.id)}>
          <Play className="w-3.5 h-3.5" />
          Resume
        </Button>
      )}
      {device.status !== DeviceStatus.FOCUS_MODE && device.status !== DeviceStatus.OFFLINE && (
        <Button size="sm" variant="outline" onClick={() => onFocus(device.id)}>
          <Focus className="w-3.5 h-3.5" />
          Focus Mode
        </Button>
      )}
    </div>
  );
}
