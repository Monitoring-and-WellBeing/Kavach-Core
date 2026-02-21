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
        name: 'Block Gaming',
        ruleType: 'CATEGORY',
        target: 'GAMING',
        appliesTo: 'SPECIFIC_DEVICE',
        deviceId: 'device-001',
        scheduleEnabled: false,
        scheduleDays: '',
        showMessage: true,
        blockMessage: 'This app is blocked',
        active: true,
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
        rest.patch(`${BASE}/blocking/rules/:id/toggle`, (req, res, ctx) => {
          return res(ctx.json({ id: 'block-001', active: false }))
        })
      )
      const result = await blockingApi.toggleRule('block-001')
      expect(result).toBeDefined()
      expect(result.id).toBe('block-001')
    })
  })
})
