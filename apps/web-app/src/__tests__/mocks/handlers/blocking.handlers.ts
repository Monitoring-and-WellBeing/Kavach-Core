import { rest } from 'msw'
import { mockBlockingRules } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const blockingHandlers = [
  rest.get(`${BASE}/blocking/rules`, (req, res, ctx) => {
    return res(ctx.json(mockBlockingRules))
  }),

  rest.post(`${BASE}/blocking/rules`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.status(201), ctx.json({ id: 'block-new', ...body, active: true }))
  }),

  rest.put(`${BASE}/blocking/rules/:id`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.json({ id: req.params.id, ...body }))
  }),

  rest.delete(`${BASE}/blocking/rules/:id`, (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),
]
