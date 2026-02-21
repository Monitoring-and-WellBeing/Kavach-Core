import { insightsApi } from '@/lib/insights'
import { badgesApi } from '@/lib/badges'
import { subscriptionApi } from '@/lib/subscription'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { mockInsight, mockBadges, mockSubscription, mockPlans } from '../mocks/fixtures'

const BASE = 'http://localhost:8080/api/v1'

// ── AI Insights ──────────────────────────────────────────────────────────────
describe('Feature 11 — AI Insights', () => {
  describe('insightsApi', () => {
    it('get() returns insight for a device', async () => {
      const insight = await insightsApi.get('device-001')
      expect(insight.deviceId).toBe('device-001')
      expect(insight).toHaveProperty('riskLevel')
      expect(insight).toHaveProperty('insights')
    })

    it('get() returns valid risk level', async () => {
      const insight = await insightsApi.get('device-001')
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(insight.riskLevel)
    })

    it('refresh() calls POST endpoint', async () => {
      let refreshCalled = false
      server.use(
        rest.post(`${BASE}/insights/device/:id/refresh`, (req, res, ctx) => {
          refreshCalled = true
          return res(ctx.json({ ...mockInsight, generatedAt: new Date().toISOString() }))
        })
      )
      await insightsApi.refresh('device-001')
      expect(refreshCalled).toBe(true)
    })

    it('get() returns array of insights', async () => {
      const insight = await insightsApi.get('device-001')
      expect(Array.isArray(insight.insights)).toBe(true)
      expect(insight.insights.length).toBeGreaterThan(0)
    })
  })
})

// ── Achievements & Badges ─────────────────────────────────────────────────────
describe('Feature 12 — Achievements & Badges', () => {
  describe('badgesApi', () => {
    it('getProgress() returns earned badges', async () => {
      const progress = await badgesApi.getProgress('device-001')
      expect(progress.badgesEarned).toBe(1)
      expect(progress.badges[0].code).toBe('FIRST_FOCUS')
    })

    it('getProgress() returns XP total', async () => {
      const progress = await badgesApi.getProgress('device-001')
      expect(progress.totalXp).toBeGreaterThanOrEqual(0)
    })

    it('getProgress() returns player level', async () => {
      const progress = await badgesApi.getProgress('device-001')
      expect(progress.level).toBeGreaterThanOrEqual(1)
    })

    it('earned badges have required fields', async () => {
      const progress = await badgesApi.getProgress('device-001')
      const badge = progress.badges.find(b => b.earned)
      expect(badge).toHaveProperty('id')
      expect(badge).toHaveProperty('name')
      expect(badge).toHaveProperty('xpReward')
      expect(badge).toHaveProperty('earnedAt')
    })
  })
})

// ── Subscription ──────────────────────────────────────────────────────────────
describe('Feature 14 — Subscription & Plan Management', () => {
  describe('subscriptionApi', () => {
    it('getCurrent() returns subscription with plan details', async () => {
      const sub = await subscriptionApi.getCurrent()
      expect(sub.planCode).toBe('STANDARD')
      expect(sub.status).toBe('TRIAL')
      expect(sub.isTrial).toBe(true)
    })

    it('getCurrent() returns device usage metrics', async () => {
      const sub = await subscriptionApi.getCurrent()
      expect(sub).toHaveProperty('deviceCount')
      expect(sub).toHaveProperty('maxDevices')
      expect(sub).toHaveProperty('deviceUsagePercent')
      expect(sub.deviceUsagePercent).toBe(50) // 2 of 4
    })

    it('getCurrent() nearLimit is false at 50% usage', async () => {
      const sub = await subscriptionApi.getCurrent()
      expect(sub.nearLimit).toBe(false)
    })

    it('getCurrent() atLimit is false when under limit', async () => {
      const sub = await subscriptionApi.getCurrent()
      expect(sub.atLimit).toBe(false)
    })

    it('getPlans() returns B2C plans', async () => {
      const plans = await subscriptionApi.getPlans('B2C')
      expect(plans).toHaveLength(2)
      expect(plans.map(p => p.code)).toEqual(['BASIC', 'STANDARD'])
    })

    it('getPlans() marks current plan correctly', async () => {
      const plans = await subscriptionApi.getPlans('B2C')
      const current = plans.find(p => p.current)
      expect(current?.code).toBe('STANDARD')
    })

    it('createOrder() returns Razorpay order details', async () => {
      const order = await subscriptionApi.createOrder('STANDARD')
      expect(order.orderId).toMatch(/^order_/)
      expect(order.amount).toBe(29900)
      expect(order.keyId).toMatch(/^rzp_/)
    })

    it('nearLimit is true when deviceUsage >= 80%', async () => {
      server.use(
        rest.get(`${BASE}/subscription/current`, (req, res, ctx) => {
          return res(ctx.json({
            ...mockSubscription,
            deviceCount: 4,
            maxDevices: 4,
            deviceUsagePercent: 100,
            nearLimit: true,
            atLimit: true,
          }))
        })
      )
      const sub = await subscriptionApi.getCurrent()
      expect(sub.nearLimit).toBe(true)
      expect(sub.atLimit).toBe(true)
    })

    it('monthlyTotalFormatted is correct currency format', async () => {
      const sub = await subscriptionApi.getCurrent()
      expect(sub.monthlyTotalFormatted).toMatch(/^₹/)
      expect(sub.monthlyTotalFormatted).toContain('/month')
    })
  })
})
