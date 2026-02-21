import { rest } from 'msw'
import { mockGoals } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const goalHandlers = [
  rest.get(`${BASE}/goals`, (req, res, ctx) => {
    return res(ctx.json(mockGoals))
  }),

  rest.get(`${BASE}/goals/device/:deviceId`, (req, res, ctx) => {
    const deviceId = req.params.deviceId as string
    // Return goals filtered by deviceId, or all goals if deviceId matches
    const filteredGoals = mockGoals.filter((goal: any) => goal.deviceId === deviceId)
    // If no goals found, return an empty array or a default goal
    if (filteredGoals.length === 0) {
      return res(ctx.json([]))
    }
    // Map to match Goal interface structure
    return res(ctx.json(filteredGoals.map((goal: any) => ({
      id: goal.id,
      deviceId: goal.deviceId,
      deviceName: 'Test Device',
      title: goal.title,
      goalType: goal.type || goal.goalType || 'SCREEN_TIME_LIMIT',
      period: 'DAILY',
      targetValue: goal.targetValue,
      active: goal.active,
      currentValue: goal.currentValue || 0,
      progressPercent: goal.progressPercent || 0,
      metToday: false,
      progressLabel: `${goal.currentValue || 0}/${goal.targetValue}`,
      history: [],
    }))))
  }),

  rest.post(`${BASE}/goals`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.status(201), ctx.json({ id: 'goal-new', ...body, progressPercent: 0 }))
  }),

  rest.put(`${BASE}/goals/:id`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.json({ id: req.params.id, ...body }))
  }),

  rest.delete(`${BASE}/goals/:id`, (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),
]
