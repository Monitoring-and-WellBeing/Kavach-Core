import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeviceInsight } from "@/lib/insights";
import { insightsQueryApi } from "@/lib/api/insightsApi";

// convenience alias kept for component compatibility
export type InsightWithDevice = DeviceInsight;

export function useInsights() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["insights"],
    queryFn: insightsQueryApi.getAll,
    staleTime: 5 * 60 * 1000,
    // GAP-16 FIXED
  });

  const refreshMutation = useMutation({
    mutationFn: insightsQueryApi.refreshOne,
    onSuccess: (updated) => {
      queryClient.setQueryData<DeviceInsight[]>(["insights"], (prev = []) =>
        prev.some((i) => i.deviceId === updated.deviceId)
          ? prev.map((i) => (i.deviceId === updated.deviceId ? updated : i))
          : [...prev, updated]
      );
    },
  });

  const dismissInsight = (id: string): void => {
    queryClient.setQueryData<DeviceInsight[]>(["insights"], (prev = []) =>
      prev.filter((i) => i.id !== id)
    );
  };

  return {
    insights: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    dismissInsight,
    refresh: async (deviceId: string) => {
      try {
        return await refreshMutation.mutateAsync(deviceId);
      } catch {
        return null;
      }
    },
    refetch: () => { void query.refetch(); },
  };
}
