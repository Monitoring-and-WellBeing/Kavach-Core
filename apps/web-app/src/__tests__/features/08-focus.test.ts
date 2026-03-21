import { focusApi } from '@/lib/focus'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { mockFocusSession } from '../mocks/fixtures'

const BASE = 'http://localhost:8080/api/v1'

describe('Feature 08 — Focus Mode', () => {

  describe('focusApi', () => {
    it('getActive() returns null when no active session', async () => {
      const session = await focusApi.getActive('device-001')
      expect(session).toBeNull()
    })

    it('start() creates focus session with duration', async () => {
      let captured: any = null
      server.use(
        rest.post(`${BASE}/focus/start`, async (req, res, ctx) => {
          captured = await req.json()
          return res(ctx.json({ ...mockFocusSession, durationMinutes: captured.durationMinutes }))
        })
      )
      const session = await focusApi.start('device-001', 25)
      expect(session.durationMinutes).toBe(25)
      expect(captured.durationMinutes).toBe(25)
    })

    it('stop() marks session as COMPLETED', async () => {
      const session = await focusApi.stop('focus-001')
      expect(session.status).toBe('COMPLETED')
    })

    it('start() returns session with endsAt timestamp', async () => {
      const session = await focusApi.start('device-001', 25)
      expect(session.endsAt).toBeDefined()
      expect(new Date(session.endsAt).getTime()).toBeGreaterThan(Date.now())
    })

    it('selfStart() creates student-initiated focus session', async () => {
      let url = ''
      server.use(
        rest.post(`${BASE}/focus/self-start`, async (req, res, ctx) => {
          url = '/focus/self-start'
          return res(ctx.json(mockFocusSession))
        })
      )
      await focusApi.selfStart('device-001', 50)
      expect(url).toBe('/focus/self-start')
    })
  })
})
