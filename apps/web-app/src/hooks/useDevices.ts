import { useState } from "react";
import { Device, DeviceStatus } from "@kavach/shared-types";
import { mockDevices } from "@/mock/devices";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [loading] = useState(false);

  const pauseDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: DeviceStatus.PAUSED } : d))
    );
  };

  const resumeDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: DeviceStatus.ONLINE } : d))
    );
  };

  const setFocusMode = (id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: DeviceStatus.FOCUS_MODE } : d
      )
    );
  };

  const getDevice = (id: string) => devices.find((d) => d.id === id);

  return { devices, loading, pauseDevice, resumeDevice, setFocusMode, getDevice };
}
