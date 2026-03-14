import { api } from './axios'

// ── Types (mirror web-app/src/lib/badges.ts) ───────────────────────────────

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type BadgeCategory =
  | 'FOCUS'
  | 'STREAK'
  | 'USAGE'
  | 'REDUCTION'
  | 'MILESTONE'
  | 'SPECIAL'

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
  level: string | number
  levelProgress: number
  badges: Badge[]
  recentlyEarned: Badge[]
  byCategory: Record<string, number>
}

// ── Display helpers ────────────────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<
  BadgeCategory,
  { label: string; emoji: string }
> = {
  FOCUS: { label: 'Focus', emoji: '🎯' },
  STREAK: { label: 'Streaks', emoji: '🔥' },
  USAGE: { label: 'Usage', emoji: '📚' },
  REDUCTION: { label: 'Reduction', emoji: '⬇️' },
  MILESTONE: { label: 'Milestone', emoji: '🏆' },
  SPECIAL: { label: 'Special', emoji: '⭐' },
}

export const LEVEL_COLORS: Record<string, string> = {
  Beginner: '#9CA3AF',
  Explorer: '#3B82F6',
  Achiever: '#8B5CF6',
  Champion: '#F59E0B',
  Legend: '#EF4444',
}

export const NEXT_LEVELS: Record<string, string> = {
  Beginner: 'Explorer',
  Explorer: 'Achiever',
  Achiever: 'Champion',
  Champion: 'Legend',
  Legend: 'Max',
}

// ── API ───────────────────────────────────────────────────────────────────────
export const badgesApi = {
  getProgress: (deviceId: string): Promise<BadgeProgress> =>
    api
      .get<BadgeProgress>(`/badges/device/${deviceId}`)
      .then((r) => r.data),
}
