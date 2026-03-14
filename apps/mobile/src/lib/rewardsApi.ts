import { api } from './axios'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RedemptionStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'FULFILLED'

export interface Reward {
  id: string
  title: string
  description: string
  category: string
  xpCost: number
  icon: string
  active: boolean
}

export interface Redemption {
  id: string
  rewardId: string
  reward: Reward
  xpSpent: number
  status: RedemptionStatus
  studentNote: string | null
  parentNote: string | null
  requestedAt: string
  requestedAtRelative: string
  resolvedAt: string | null
  fulfilledAt: string | null
}

// ── Status display config ──────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<RedemptionStatus, { label: string; color: string }> = {
  PENDING:   { label: '⏳ Pending',   color: '#F59E0B' },
  APPROVED:  { label: '✅ Approved',  color: '#10B981' },
  DENIED:    { label: '❌ Denied',    color: '#EF4444' },
  FULFILLED: { label: '🎉 Fulfilled', color: '#6366F1' },
}

// ── API ───────────────────────────────────────────────────────────────────────
export const rewardsApi = {
  getAvailable: (): Promise<Reward[]> =>
    api.get<Reward[]>('/rewards/available').then(r => r.data),

  getMine: (): Promise<Redemption[]> =>
    api.get<Redemption[]>('/rewards/redemptions/mine').then(r => r.data),

  redeem: (rewardId: string, deviceId: string, note?: string): Promise<Redemption> =>
    api
      .post<Redemption>(`/rewards/${rewardId}/redeem`, { deviceId, note: note || null })
      .then(r => r.data),
}
