import { rest } from 'msw'
import { mockFocusSession } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const focusHandlers = [
  rest.get(`${BASE}/focus/device/:deviceId/active`, (req, res, ctx) => {
    return res(ctx.json(null))    // no active session by default
  }),

  rest.post(`${BASE}/focus/start`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.json({
      ...mockFocusSession,
      durationMinutes: body.durationMinutes || 25,
      title: body.title || `${body.durationMinutes || 25}-minute Focus`,
      remainingSeconds: (body.durationMinutes || 25) * 60,
      progressPercent: 0,
    }))
  }),

  rest.post(`${BASE}/focus/:sessionId/stop`, (req, res, ctx) => {
    return res(ctx.json({ ...mockFocusSession, status: 'COMPLETED' }))
  }),

  rest.post(`${BASE}/focus/self-start`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.json({
      ...mockFocusSession,
      durationMinutes: body.durationMinutes || 25,
      title: body.title || `${body.durationMinutes || 25}-minute Focus`,
      remainingSeconds: (body.durationMinutes || 25) * 60,
      progressPercent: 0,
    }))
  }),

  rest.get(`${BASE}/focus/device/:deviceId/history`, (req, res, ctx) => {
    return res(ctx.json([mockFocusSession]))
  }),

  rest.get(`${BASE}/focus/device/:deviceId/stats/today`, (req, res, ctx) => {
    return res(ctx.json({
      focusMinutesToday: 50,
      sessionsToday: 2,
    }))
  }),

  rest.get(`${BASE}/focus/whitelist`, (req, res, ctx) => {
    return res(ctx.json(['Chrome', 'VS Code', 'Notion']))
  }),
]
