import { api } from './axios'

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type BadgeCategory = 'FOCUS' | 'STREAK' | 'USAGE' | 'REDUCTION' | 'MILESTONE' | 'SPECIAL'

export interface Badge {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  tier: BadgeTier
  xpReward: number
  earned: boolean
  earnedAt?: string
}

export interface BadgeProgress {
  totalXp: number
  badgesEarned: number
  badgesTotal: number
  level: string | number  // Can be string like "Explorer" or number like 1
  levelProgress: number
  badges: Badge[]
  recentlyEarned: Badge[]
  byCategory: Record<string, number>
}

export const badgesApi = {
  getProgress: (deviceId: string) =>
    api.get<BadgeProgress>(`/badges/device/${deviceId}`).then(r => r.data),

  evaluate: (deviceId: string) =>
    api.post<string[]>(`/badges/device/${deviceId}/evaluate`).then(r => r.data),
}
