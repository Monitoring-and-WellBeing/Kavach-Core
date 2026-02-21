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

    it('getApps() returns app usage with percent', async () => {
      const apps = await reportsApi.getApps('device-001')
      expect(apps.length).toBeGreaterThan(0)
      expect(apps[0]).toHaveProperty('app')
      expect(apps[0]).toHaveProperty('minutes')
      expect(apps[0]).toHaveProperty('percent')
    })

    it('getCategories() returns category breakdown', async () => {
      const cats = await reportsApi.getCategories('device-001')
      expect(cats.length).toBeGreaterThan(0)
      expect(cats[0]).toHaveProperty('category')
      expect(cats[0]).toHaveProperty('percent')
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
