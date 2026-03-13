import { api } from './axios'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RewardCategory =
  | 'SCREEN_TIME'
  | 'OUTING'
  | 'FOOD_TREAT'
  | 'PURCHASE'
  | 'PRIVILEGE'
  | 'CUSTOM'

export type RedemptionStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'FULFILLED'

export interface Reward {
  id: string
  title: string
  description: string
  category: RewardCategory
  xpCost: number
  icon: string
  active: boolean
  createdAt: string
}

export interface Redemption {
  id: string
  rewardId: string
  reward: Reward
  studentUserId: string
  studentName: string
  xpSpent: number
  status: RedemptionStatus
  studentNote: string | null
  parentNote: string | null
  requestedAt: string
  requestedAtRelative: string
  resolvedAt: string | null
  fulfilledAt: string | null
}

// ── Predefined suggestions (click to prefill in create modal) ─────────────────

export interface RewardSuggestion {
  icon: string
  title: string
  category: RewardCategory
  xpCost: number
  description: string
}

export const REWARD_SUGGESTIONS: RewardSuggestion[] = [
  { icon: '📱', title: '30 min extra screen time', category: 'SCREEN_TIME',  xpCost: 200, description: 'Earn extra screen time on any app' },
  { icon: '🍕', title: 'Pizza night',              category: 'FOOD_TREAT',   xpCost: 350, description: 'Choose your favourite pizza for dinner' },
  { icon: '🌳', title: 'Park outing',              category: 'OUTING',       xpCost: 400, description: 'A trip to the park or playground' },
  { icon: '📚', title: 'Book of your choice',      category: 'PURCHASE',     xpCost: 500, description: 'Pick any book up to ₹500' },
  { icon: '🌙', title: 'Stay up 30 min late',      category: 'PRIVILEGE',    xpCost: 300, description: 'On a Friday or Saturday night' },
  { icon: '🎮', title: 'Game of your choice',      category: 'PURCHASE',     xpCost: 800, description: 'Pick any mobile game (parent approves)' },
]

export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  SCREEN_TIME: 'Screen Time',
  OUTING:      'Outing',
  FOOD_TREAT:  'Food Treat',
  PURCHASE:    'Purchase',
  PRIVILEGE:   'Privilege',
  CUSTOM:      'Custom',
}

export const STATUS_CONFIG: Record<RedemptionStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: '⏳ Pending',   color: '#D97706', bg: '#FEF3C7' },
  APPROVED:  { label: '✅ Approved',  color: '#059669', bg: '#D1FAE5' },
  DENIED:    { label: '❌ Denied',    color: '#DC2626', bg: '#FEE2E2' },
  FULFILLED: { label: '🎉 Fulfilled', color: '#7C3AED', bg: '#EDE9FE' },
}

// ── API ───────────────────────────────────────────────────────────────────────

export const rewardsApi = {
  // Parent
  getAll: () =>
    api.get<Reward[]>('/rewards').then(r => r.data),

  create: (data: { title: string; description: string; category: string; xpCost: number; icon: string }) =>
    api.post<Reward>('/rewards', data).then(r => r.data),

  toggle: (id: string) =>
    api.patch<Reward>(`/rewards/${id}/toggle`).then(r => r.data),

  getPending: () =>
    api.get<Redemption[]>('/rewards/redemptions/pending').then(r => r.data),

  resolve: (id: string, status: 'APPROVED' | 'DENIED', parentNote?: string) =>
    api.post<Redemption>(`/rewards/redemptions/${id}/resolve`, { status, parentNote }).then(r => r.data),

  fulfill: (id: string) =>
    api.post<Redemption>(`/rewards/redemptions/${id}/fulfill`).then(r => r.data),

  // Student
  getAvailable: () =>
    api.get<Reward[]>('/rewards/available').then(r => r.data),

  redeem: (id: string, deviceId: string, note?: string) =>
    api.post<Redemption>(`/rewards/${id}/redeem`, { deviceId, note }).then(r => r.data),

  getMine: () =>
    api.get<Redemption[]>('/rewards/redemptions/mine').then(r => r.data),
}
