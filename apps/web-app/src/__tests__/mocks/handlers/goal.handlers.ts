import { rest } from 'msw'
import { mockGoals } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const goalHandlers = [
  rest.get(`${BASE}/goals`, (req, res, ctx) => {
    return res(ctx.json(mockGoals))
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
