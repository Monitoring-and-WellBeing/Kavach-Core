import { api } from './axios'

export type GoalType =
  | 'FOCUS_MINUTES' | 'SCREEN_TIME_LIMIT' | 'EDUCATION_MINUTES'
  | 'GAMING_LIMIT'  | 'FOCUS_SESSIONS'    | 'NO_LATE_NIGHT'

export interface DayResult {
  date: string; dayLabel: string; value: number; target: number; met: boolean
}

export interface Goal {
  id: string; deviceId: string; deviceName: string
  title: string; goalType: GoalType; period: 'DAILY' | 'WEEKLY'
  targetValue: number; active: boolean; currentValue: number
  progressPercent: number; metToday: boolean; progressLabel: string
  history: DayResult[]
}

export const GOAL_TYPE_CONFIG: Record<GoalType, {
  label: string; emoji: string; desc: string; unit: string
  defaultTarget: number; isLimit: boolean
}> = {
  FOCUS_MINUTES:     { label: 'Focus Time',      emoji: '🎯', desc: 'Minutes of focus per day',   unit: 'min',      defaultTarget: 45,  isLimit: false },
  SCREEN_TIME_LIMIT: { label: 'Screen Time Cap', emoji: '⏱️', desc: 'Max screen time per day',     unit: 'min',      defaultTarget: 240, isLimit: true  },
  EDUCATION_MINUTES: { label: 'Study Time',      emoji: '📚', desc: 'Minutes on education apps',   unit: 'min',      defaultTarget: 60,  isLimit: false },
  GAMING_LIMIT:      { label: 'Gaming Cap',      emoji: '🎮', desc: 'Max gaming time per day',     unit: 'min',      defaultTarget: 60,  isLimit: true  },
  FOCUS_SESSIONS:    { label: 'Focus Sessions',  emoji: '⚡', desc: 'Focus sessions completed',    unit: 'sessions', defaultTarget: 2,   isLimit: false },
  NO_LATE_NIGHT:     { label: 'No Late Night',   emoji: '🌙', desc: 'Zero usage after 10 PM',      unit: '',         defaultTarget: 1,   isLimit: true  },
}

export const goalsApi = {
  getForDevice: (deviceId: string) =>
    api.get<Goal[]>(`/goals/device/${deviceId}`).then(r => r.data),
  getAll: () =>
    api.get<Goal[]>('/goals').then(r => r.data),
  create: (data: { deviceId: string; title: string; goalType: GoalType; period: string; targetValue: number }) =>
    api.post<Goal>('/goals', data).then(r => r.data),
  update: (id: string, patch: Partial<Goal>) =>
    api.put<Goal>(`/goals/${id}`, patch).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/goals/${id}`),
}
