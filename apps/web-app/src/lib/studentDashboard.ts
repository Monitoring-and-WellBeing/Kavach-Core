import { api } from './axios'

export interface StudentStats {
  screenTimeSeconds: number
  screenTimeFormatted: string
  focusMinutesToday: number
  focusSessionsToday: number
}

export interface TopApp {
  appName: string
  category: string
  durationSeconds: number
}

export interface CategoryData {
  category: string
  durationSeconds: number
}

export interface WeeklyPoint {
  date: string
  dayLabel: string
  screenTimeSeconds: number
}

export interface ActiveFocusSession {
  sessionId: string
  title: string
  remainingSeconds: number
}

export interface StudentDashboard {
  deviceLinked: boolean
  deviceId?: string
  deviceName?: string
  focusScore: number
  streak: number
  stats: StudentStats
  topApps: TopApp[]
  categories: CategoryData[]
  weeklyData: WeeklyPoint[]
  activeFocusSession: ActiveFocusSession | null
  message?: string
}

export const studentDashboardApi = {
  get: () =>
    api.get<StudentDashboard>('/dashboard/student').then(r => r.data),
}
