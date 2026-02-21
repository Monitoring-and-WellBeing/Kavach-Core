import { goalsApi } from '@/lib/goals'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { mockGoals } from '../mocks/fixtures'

const BASE = 'http://localhost:8080/api/v1'

describe('Feature 13 — Goals System', () => {

  describe('goalsApi', () => {
    it('getAll() returns list of goals', async () => {
      const goals = await goalsApi.getAll()
      expect(goals).toHaveLength(1)
      expect(goals[0].id).toBe('goal-001')
    })

    it('getAll() returns goals with progress', async () => {
      const goals = await goalsApi.getAll()
      expect(goals[0]).toHaveProperty('progressPercent')
      expect(goals[0].progressPercent).toBeGreaterThanOrEqual(0)
      expect(goals[0].progressPercent).toBeLessThanOrEqual(100)
    })

    it('create() sends POST with goal data', async () => {
      let captured: any = null
      server.use(
        rest.post(`${BASE}/goals`, async (req, res, ctx) => {
          captured = await req.json()
          return res(ctx.status(201), ctx.json({ id: 'new-goal', ...captured, progressPercent: 0 }))
        })
      )
      const goal = await goalsApi.create({
        deviceId: 'device-001',
        title: 'Reduce screen time',
        goalType: 'SCREEN_TIME_LIMIT',
        period: 'DAILY',
        targetValue: 120,
      })
      expect(goal.progressPercent).toBe(0)
      expect(captured.targetValue).toBe(120)
    })

    it('delete() removes goal', async () => {
      let deletedId = ''
      server.use(
        rest.delete(`${BASE}/goals/:id`, (req, res, ctx) => {
          deletedId = req.params.id as string
          return res(ctx.json({ success: true }))
        })
      )
      await goalsApi.delete('goal-001')
      expect(deletedId).toBe('goal-001')
    })

    it('getForDevice() returns goals for a specific device', async () => {
      const goals = await goalsApi.getForDevice('device-001')
      expect(Array.isArray(goals)).toBe(true)
    })
  })
})
