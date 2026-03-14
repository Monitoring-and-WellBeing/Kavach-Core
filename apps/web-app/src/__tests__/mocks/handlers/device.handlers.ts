import { rest } from 'msw'
import { mockDevice, mockDevice2 } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const deviceHandlers = [
  rest.get(`${BASE}/devices`, (req, res, ctx) => {
    return res(ctx.json([mockDevice, mockDevice2]))
  }),

  rest.get(`${BASE}/devices/:id`, (req, res, ctx) => {
    const device = [mockDevice, mockDevice2].find(d => d.id === req.params.id)
    if (!device) return res(ctx.status(404), ctx.json({ message: 'Not found' }))
    return res(ctx.json(device))
  }),

  rest.post(`${BASE}/devices/link`, async (req, res, ctx) => {
    const body = await req.json() as any
    return res(ctx.status(201), ctx.json({
      ...mockDevice,
      id: 'device-new',
      name: body.deviceName || 'New Device',
    }))
  }),

  rest.post(`${BASE}/devices/:id/pause`, (req, res, ctx) => {
    return res(ctx.json({ ...mockDevice, id: req.params.id as string, status: 'PAUSED' }))
  }),

  rest.post(`${BASE}/devices/:id/resume`, (req, res, ctx) => {
    return res(ctx.json({ ...mockDevice, id: req.params.id as string, status: 'ONLINE' }))
  }),

  rest.delete(`${BASE}/devices/:id`, (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),
]
