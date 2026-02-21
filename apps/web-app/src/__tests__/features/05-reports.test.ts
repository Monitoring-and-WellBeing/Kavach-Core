import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { reportsApi } from '@/lib/reports'

const BASE = 'http://localhost:8080/api/v1'

describe('Feature 07 — Reports & Analytics', () => {

  describe('reportsApi', () => {
    it('getWeekly() returns 7 days of data', async () => {
      const data = await reportsApi.getWeekly('device-001')
      expect(data.days).toHaveLength(7)
      expect(data.screenTime).toHaveLength(7)
    })

    it('getWeekly() returns numeric screen time values', async () => {
      const data = await reportsApi.getWeekly('device-001')
      data.screenTime.forEach((v: number) => {
        expect(typeof v).toBe('number')
        expect(v).toBeGreaterThanOrEqual(0)
      })
    })

    it('getTopApps() returns app usage with percent', async () => {
      const data = await reportsApi.getTopApps('device-001')
      expect(data.apps.length).toBeGreaterThan(0)
      expect(data.apps[0]).toHaveProperty('appName')
      expect(data.apps[0]).toHaveProperty('durationSeconds')
      expect(data.apps[0]).toHaveProperty('percentOfTotal')
    })

    it('getCategories() returns category breakdown', async () => {
      const data = await reportsApi.getCategories('device-001')
      expect(data.categories.length).toBeGreaterThan(0)
      expect(data.categories[0]).toHaveProperty('category')
      expect(data.categories[0]).toHaveProperty('percentage')
    })

    it('handles device with no activity (empty response)', async () => {
      server.use(
        rest.get(`${BASE}/reports/device/:id/weekly`, (req, res, ctx) => {
          return res(ctx.json({ days: [], screenTime: [], focusTime: [] }))
        })
      )
      const data = await reportsApi.getWeekly('device-no-data')
      expect(data.days).toHaveLength(0)
    })

    it('getMonthly() returns 30 days of data', async () => {
      const data = await reportsApi.getMonthly('device-001')
      expect(data.days).toHaveLength(30)
    })
  })
})
