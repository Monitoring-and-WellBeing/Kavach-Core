import { useQuery } from '@tanstack/react-query'
import { reportsQueryApi, type ReportsBundle, type Period } from '@/lib/api/reportsApi'

export function useReports(deviceId: string | null, period: Period = 'weekly') {
  const query = useQuery<ReportsBundle>({
    queryKey: ['reports', deviceId, period],
    queryFn: () => reportsQueryApi.get(deviceId as string, period),
    enabled: Boolean(deviceId),
    staleTime: 5 * 60 * 1000,
    // GAP-16 FIXED
  })

  return {
    trendData: query.data?.trendData ?? null,
    appUsage: query.data?.appUsage ?? null,
    categories: query.data?.categories ?? null,
    heatmap: query.data?.heatmap ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => { void query.refetch() },
  }
}
