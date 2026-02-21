import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { alertsApi } from '@/lib/alerts'
import { mockAlertRules } from '../mocks/fixtures'

const BASE = 'http://localhost:8080/api/v1'

describe('Feature 05 — Alerts & Rules', () => {

  describe('alertsApi', () => {
    it('getRules() returns alert rules list', async () => {
      const rules = await alertsApi.getRules()
      expect(rules).toHaveLength(1)
      expect(rules[0].id).toBe('rule-001')
    })

    it('getRules() returns rules with required fields', async () => {
      const rules = await alertsApi.getRules()
      expect(rules[0]).toHaveProperty('name')
      expect(rules[0]).toHaveProperty('type')
      expect(rules[0]).toHaveProperty('active')
    })

    it('createRule() sends POST with rule data', async () => {
      let body: any = null
      server.use(
        rest.post(`${BASE}/alerts/rules`, async (req, res, ctx) => {
          body = await req.json()
          return res(ctx.status(201), ctx.json({ id: 'new', ...body }))
        })
      )
      const newRule = {
        name: 'Gaming Alert',
        type: 'APP_USAGE',
        threshold: 60,
        severity: 'HIGH',
        deviceId: 'device-001',
      }
      const result = await alertsApi.createRule(newRule)
      expect(result.name).toBe('Gaming Alert')
      expect(body.severity).toBe('HIGH')
    })

    it('deleteRule() sends DELETE request', async () => {
      let deletedId = ''
      server.use(
        rest.delete(`${BASE}/alerts/rules/:id`, (req, res, ctx) => {
          deletedId = req.params.id as string
          return res(ctx.json({ success: true }))
        })
      )
      await alertsApi.deleteRule('rule-001')
      expect(deletedId).toBe('rule-001')
    })

    it('updateRule() sends PUT request', async () => {
      const updated = await alertsApi.updateRule('rule-001', { active: false })
      expect(updated).toBeDefined()
    })
  })
})
