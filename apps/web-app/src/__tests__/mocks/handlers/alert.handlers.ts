import { rest } from 'msw'
import { mockAlertRules } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const alertHandlers = [
  rest.get(`${BASE}/alerts/rules`, (req, res, ctx) => {
    return res(ctx.json(mockAlertRules))
  }),

  rest.post(`${BASE}/alerts/rules`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.status(201), ctx.json({ id: 'rule-new', ...body }))
  }),

  rest.put(`${BASE}/alerts/rules/:id`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.json({ id: req.params.id, ...body }))
  }),

  rest.delete(`${BASE}/alerts/rules/:id`, (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),
]
