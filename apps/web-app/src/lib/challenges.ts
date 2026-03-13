import { api } from './axios'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChildChallenge {
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

export interface MoodDay {
  mood: number   // 0 = no check-in, 1–5 = mood value
  dayLabel: string
  checkedInAt?: string
  note?: string
}

export interface MoodTrend {
  last7Days: MoodDay[]
  hasAlert: boolean
  alertMessage?: string
  checkinStreak: number
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const challengesParentApi = {
  /** Get today's challenges for a specific device (parent view) */
  getChallenges: (deviceId: string): Promise<ChildChallenge[]> =>
    api
      .get<ChildChallenge[]>(`/challenges/today/${deviceId}`)
      .then((r) => r.data),

  /** Get 7-day mood trend for a device */
  getMoodTrend: (deviceId: string): Promise<MoodTrend> =>
    api.get<MoodTrend>(`/mood/trend/${deviceId}`).then((r) => r.data),
}
