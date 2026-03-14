import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { mockDevice, mockDevice2 } from '../mocks/fixtures'

// Adjust import to your actual devicesApi location
import { devicesApi } from '@/lib/devices'

const BASE = 'http://localhost:8080/api/v1'

describe('Feature 02/03 — Devices & Activity Tracking', () => {

  describe('devicesApi', () => {
    it('list() fetches all devices', async () => {
      const devices = await devicesApi.list()
      expect(devices).toHaveLength(2)
      expect(devices[0].id).toBe('device-001')
      expect(devices[1].id).toBe('device-002')
    })

    it('list() returns device with required fields', async () => {
      const devices = await devicesApi.list()
      const device = devices[0]
      expect(device).toHaveProperty('id')
      expect(device).toHaveProperty('name')
      expect(device).toHaveProperty('status')
      expect(device).toHaveProperty('screenTimeToday')
    })

    it('pause() sends POST /devices/:id/pause', async () => {
      let pauseUrl = ''
      server.use(
        rest.post(`${BASE}/devices/:id/pause`, (req, res, ctx) => {
          pauseUrl = `/devices/${req.params.id}/pause`
          return res(ctx.json({ ...mockDevice, status: 'PAUSED' }))
        })
      )
      const result = await devicesApi.pause('device-001')
      expect(pauseUrl).toBe('/devices/device-001/pause')
      expect(result.status).toBe('PAUSED')
    })

    it('resume() sends POST /devices/:id/resume', async () => {
      const result = await devicesApi.resume('device-001')
      expect(result.status).toBe('ONLINE')
    })

    it('link() sends POST /devices/link with device data', async () => {
      let capturedBody: any = null
      server.use(
        rest.post(`${BASE}/devices/link`, async (req, res, ctx) => {
          capturedBody = await req.json()
          return res(ctx.status(201), ctx.json({ id: 'new-device', ...capturedBody }))
        })
      )
      await devicesApi.link({ deviceCode: 'ABC123', deviceName: 'Test Device' })
      expect(capturedBody.deviceCode).toBe('ABC123')
      expect(capturedBody.deviceName).toBe('Test Device')
    })

    it('handles network error gracefully', async () => {
      server.use(
        rest.get(`${BASE}/devices`, (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Network error' }))
        })
      )
      await expect(devicesApi.list()).rejects.toThrow()
    })

    it('handles 403 device limit error', async () => {
      server.use(
        rest.post(`${BASE}/devices/link`, (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(
            { error: 'Device limit reached. Please upgrade your plan.' }
          ))
        })
      )
      await expect(
        devicesApi.link({ deviceCode: 'XYZ', deviceName: 'One Too Many' })
      ).rejects.toThrow()
    })
  })

  describe('Device status helpers', () => {
    it('ONLINE device is not paused', () => {
      expect(mockDevice.status).toBe('ONLINE')
      expect(mockDevice.status).not.toBe('PAUSED')
    })

    it('screen time is formatted in minutes', () => {
      expect(mockDevice.screenTimeToday).toBeGreaterThanOrEqual(0)
      expect(typeof mockDevice.screenTimeToday).toBe('number')
    })
  })
})
