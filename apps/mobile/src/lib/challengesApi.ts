import { api } from './axios'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Challenge {
  id: string
  title: string
  description: string
  icon: string
  challengeType: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  xpReward: number
  currentValue: number
  targetValue: number
  completed: boolean
  completedAt?: string
}

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  recoveryTokens: number
  last7Days: boolean[]
  dayLabels: string[]
  streakBroken: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const challengesApi = {
  /** Get today's 3 challenges for a device */
  getToday: (deviceId: string): Promise<Challenge[]> =>
    api.get<Challenge[]>(`/challenges/today/${deviceId}`).then((r) => r.data),

  /** Get streak info (current streak, 7-day history, recovery tokens) */
  getStreak: (deviceId: string): Promise<StreakInfo> =>
    api.get<StreakInfo>(`/challenges/streak/${deviceId}`).then((r) => r.data),

  /** Use a recovery token to restore a broken streak */
  useRecoveryToken: (deviceId: string): Promise<StreakInfo> =>
    api
      .post<StreakInfo>('/challenges/streak/recover', { deviceId })
      .then((r) => r.data),
}

export const moodApi = {
  /** Submit today's mood (1–5) */
  submit: (
    deviceId: string,
    mood: number,
    note?: string
  ): Promise<{ mood: number; checkedInAt: string }> =>
    api
      .post(`/mood/checkin/${deviceId}`, { mood, note })
      .then((r) => r.data),

  /** Get today's mood check-in (if already submitted) */
  getToday: (
    deviceId: string
  ): Promise<{ mood: number; checkedInAt: string } | { checked: false }> =>
    api.get(`/mood/today/${deviceId}`).then((r) => r.data),
}
