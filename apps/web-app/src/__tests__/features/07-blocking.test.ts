import { blockingApi } from '@/lib/blocking'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'

const BASE = 'http://localhost:8080/api/v1'

describe('Feature 06 — App & Website Blocking', () => {

  describe('blockingApi', () => {
    it('getRules() returns blocking rules', async () => {
      const rules = await blockingApi.getRules()
      expect(rules).toHaveLength(1)
      expect(rules[0].target).toBe('YouTube')
    })

    it('createRule() creates block rule', async () => {
      let captured: any = null
      server.use(
        rest.post(`${BASE}/blocking/rules`, async (req, res, ctx) => {
          captured = await req.json()
          return res(ctx.status(201), ctx.json({ id: 'new-block', ...captured, active: true }))
        })
      )
      const rule = await blockingApi.createRule({
        type: 'CATEGORY',
        target: 'GAMING',
        deviceId: 'device-001',
      })
      expect(rule.active).toBe(true)
      expect(captured.target).toBe('GAMING')
    })

    it('deleteRule() removes block rule', async () => {
      let deletedId = ''
      server.use(
        rest.delete(`${BASE}/blocking/rules/:id`, (req, res, ctx) => {
          deletedId = req.params.id as string
          return res(ctx.json({ success: true }))
        })
      )
      await blockingApi.deleteRule('block-001')
      expect(deletedId).toBe('block-001')
    })

    it('toggleRule() updates active status', async () => {
      server.use(
        rest.put(`${BASE}/blocking/rules/:id`, async (req, res, ctx) => {
          const body = await req.json() as any
          return res(ctx.json({ id: 'block-001', active: body.active }))
        })
      )
      const result = await blockingApi.updateRule('block-001', { active: false })
      expect(result.active).toBe(false)
    })
  })
})
