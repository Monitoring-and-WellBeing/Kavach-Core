import { rest } from 'msw'
import { mockTokens } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const authHandlers = [
  rest.post(`${BASE}/auth/login`, async (req, res, ctx) => {
    const body = await req.json() as any
    if (body.email === 'parent@demo.com' && body.password === 'demo123') {
      return res(ctx.json(mockTokens))
    }
    return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
  }),

  rest.post(`${BASE}/auth/logout`, (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),

  rest.get(`${BASE}/auth/me`, (req, res, ctx) => {
    return res(ctx.json(mockTokens.user))
  }),

  rest.post(`${BASE}/auth/refresh`, (req, res, ctx) => {
    return res(ctx.json({ accessToken: 'new.mock.token' }))
  }),
]
