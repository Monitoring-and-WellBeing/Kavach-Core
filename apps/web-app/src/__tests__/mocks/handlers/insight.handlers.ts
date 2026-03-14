import { rest } from 'msw'
import { mockInsight } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const insightHandlers = [
  rest.get(`${BASE}/insights/device/:id`, (req, res, ctx) => {
    return res(ctx.json(mockInsight))
  }),

  rest.post(`${BASE}/insights/device/:id/refresh`, (req, res, ctx) => {
    return res(ctx.json({ ...mockInsight, generatedAt: new Date().toISOString() }))
  }),
]
