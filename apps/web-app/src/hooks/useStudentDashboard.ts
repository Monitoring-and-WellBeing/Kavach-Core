import { useQuery } from '@tanstack/react-query'
import { studentDashboardApi, StudentDashboard } from '@/lib/studentDashboard'

export const STUDENT_DASHBOARD_KEY = ['student-dashboard'] as const

export function useStudentDashboard() {
  const { data, isLoading, error, refetch } = useQuery<StudentDashboard>({
    queryKey: STUDENT_DASHBOARD_KEY,
    queryFn: studentDashboardApi.get,
    staleTime: 60_000,
  })

  return {
    dashboard: data ?? null,
    loading: isLoading,
    error: error ? ((error as any).response?.data?.message ?? 'Failed to load dashboard') : null,
    streak: data?.streak ?? 0,
    focusScore: data?.focusScore ?? 0,
    refetch,
  }
}
