import { api } from './axios'

// ── Types (mirror web-app/src/lib/studentDashboard.ts) ─────────────────────

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

// ── Category display helpers ───────────────────────────────────────────────────
export const CAT_COLORS: Record<string, string> = {
  EDUCATION: '#3B82F6',
  GAMING: '#EF4444',
  ENTERTAINMENT: '#F59E0B',
  SOCIAL_MEDIA: '#8B5CF6',
  PRODUCTIVITY: '#22C55E',
  COMMUNICATION: '#06B6D4',
  OTHER: '#9CA3AF',
}

export const CAT_LABELS: Record<string, string> = {
  EDUCATION: 'Education',
  GAMING: 'Gaming',
  ENTERTAINMENT: 'Entertainment',
  SOCIAL_MEDIA: 'Social',
  PRODUCTIVITY: 'Productivity',
  COMMUNICATION: 'Communication',
  OTHER: 'Other',
}

// ── API ───────────────────────────────────────────────────────────────────────
export const studentDashboardApi = {
  get: (): Promise<StudentDashboard> =>
    api.get<StudentDashboard>('/dashboard/student').then((r) => r.data),
}
