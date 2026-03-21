import { insightsApi, type DeviceInsight } from "@/lib/insights";
import { devicesApi, type Device } from "@/lib/devices";

export const insightsQueryApi = {
  async getAll(): Promise<DeviceInsight[]> {
    const devices: Device[] = await devicesApi.list();
    const results = await Promise.allSettled(devices.map((d) => insightsApi.get(d.id)));
    return results
      .filter((r): r is PromiseFulfilledResult<DeviceInsight> => r.status === "fulfilled")
      .map((r) => r.value);
  },
  refreshOne(deviceId: string): Promise<DeviceInsight> {
    return insightsApi.refresh(deviceId);
  },
};
