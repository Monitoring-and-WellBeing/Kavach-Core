import { useState, useEffect, useCallback } from "react";
import { insightsApi, DeviceInsight } from "@/lib/insights";
import { devicesApi, Device } from "@/lib/devices";

export interface InsightWithDevice extends DeviceInsight {
  // convenience alias kept for component compatibility
}

export function useInsights() {
  const [insights, setInsights] = useState<DeviceInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all devices, then load an insight for each
      const devices: Device[] = await devicesApi.list();
      const results = await Promise.allSettled(
        devices.map((d) => insightsApi.get(d.id))
      );
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<DeviceInsight> => r.status === "fulfilled")
        .map((r) => r.value);
      setInsights(loaded);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dismissInsight = useCallback((id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const refresh = useCallback(async (deviceId: string) => {
    try {
      const updated = await insightsApi.refresh(deviceId);
      setInsights((prev) =>
        prev.some((i) => i.deviceId === deviceId)
          ? prev.map((i) => (i.deviceId === deviceId ? updated : i))
          : [...prev, updated]
      );
      return updated;
    } catch {
      return null;
    }
  }, []);

  return { insights, loading, error, dismissInsight, refresh, refetch: load };
}
