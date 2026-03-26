import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { bufferSessions, readBuffer, clearBuffer, BufferedLog } from '../offline-buffer/buffer'
import { UsageSession } from '../tracking/tracker'

// Mock fs
jest.mock('fs/promises')
const mockFs = fs as jest.Mocked<typeof fs>

describe('Offline Buffer', () => {
  const mockDeviceId = 'device-001'
  const mockSession: UsageSession = {
    processName: 'code.exe',
    appName: 'VS Code',
    windowTitle: 'test.ts',
    category: 'EDUCATION',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    endedAt: new Date('2024-01-01T10:05:00Z'),
    durationSeconds: 300,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.mkdir.mockResolvedValue(undefined)
    mockFs.writeFile.mockResolvedValue(undefined)
    mockFs.readFile.mockResolvedValue('[]')
  })

  describe('bufferSessions', () => {
    it('entries added to buffer when offline', async () => {
      const sessions = [mockSession]
      
      await bufferSessions(mockDeviceId, sessions)

      expect(mockFs.mkdir).toHaveBeenCalled()
      expect(mockFs.writeFile).toHaveBeenCalled()
      
      // Verify the written data structure
      const writeCall = mockFs.writeFile.mock.calls[0]
      expect(writeCall).toBeDefined()
      
      if (writeCall) {
        const writtenData = JSON.parse(writeCall[1] as string)
        expect(Array.isArray(writtenData)).toBe(true)
        expect(writtenData.length).toBeGreaterThan(0)
        expect(writtenData[0]).toHaveProperty('deviceId', mockDeviceId)
        expect(writtenData[0]).toHaveProperty('session')
        expect(writtenData[0]).toHaveProperty('bufferedAt')
      }
    })

    it('buffer does not exceed MAX_BUFFER_SIZE', async () => {
      // Create many sessions
      const manySessions: UsageSession[] = Array.from({ length: 600 }, (_, i) => ({
        ...mockSession,
        processName: `app${i}.exe`,
        startedAt: new Date(`2024-01-01T${10 + Math.floor(i / 60)}:${i % 60}:00Z`),
        endedAt: new Date(`2024-01-01T${10 + Math.floor(i / 60)}:${(i % 60) + 1}:00Z`),
      }))

      // Mock existing buffer with some entries
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify([
        { deviceId: mockDeviceId, session: mockSession, bufferedAt: new Date().toISOString() },
      ]))

      await bufferSessions(mockDeviceId, manySessions)

      // Verify buffer was trimmed to MAX_BUFFER_SIZE (500)
      const writeCall = mockFs.writeFile.mock.calls[0]
      if (writeCall) {
        const writtenData = JSON.parse(writeCall[1] as string)
        expect(writtenData.length).toBeLessThanOrEqual(500)
      }
    })

    it('handles write errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValueOnce(new Error('Disk full'))

      // Should not throw
      await expect(bufferSessions(mockDeviceId, [mockSession])).resolves.not.toThrow()
    })
  })

  describe('readBuffer', () => {
    it('buffer flushed in order when reconnected', async () => {
      const bufferedLogs: BufferedLog[] = [
        {
          deviceId: mockDeviceId,
          session: mockSession,
          bufferedAt: '2024-01-01T10:00:00Z',
        },
        {
          deviceId: mockDeviceId,
          session: { ...mockSession, processName: 'chrome.exe' },
          bufferedAt: '2024-01-01T10:05:00Z',
        },
      ]

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(bufferedLogs))

      const result = await readBuffer()

      expect(result).toHaveLength(2)
      expect(result[0].session.processName).toBe('code.exe')
      expect(result[1].session.processName).toBe('chrome.exe')
      // Order should be preserved
      expect(new Date(result[0].bufferedAt).getTime())
        .toBeLessThan(new Date(result[1].bufferedAt).getTime())
    })

    it('returns empty array when buffer file does not exist', async () => {
      mockFs.readFile.mockRejectedValueOnce(new Error('File not found'))

      const result = await readBuffer()

      expect(result).toEqual([])
    })

    it('returns empty array for invalid JSON', async () => {
      mockFs.readFile.mockResolvedValueOnce('invalid json')

      const result = await readBuffer()

      expect(result).toEqual([])
    })
  })

  describe('clearBuffer', () => {
    it('clears buffer file', async () => {
      await clearBuffer()

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        '[]'
      )
    })

    it('handles clear errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValueOnce(new Error('Permission denied'))

      // Should not throw
      await expect(clearBuffer()).resolves.not.toThrow()
    })
  })

  describe('buffer size limits', () => {
    it('drops oldest entries when buffer exceeds MAX_BUFFER_SIZE', async () => {
      const MAX_BUFFER_SIZE = 500
      
      // Create existing buffer with MAX_BUFFER_SIZE entries
      const existingBuffer: BufferedLog[] = Array.from({ length: MAX_BUFFER_SIZE }, (_, i) => ({
        deviceId: mockDeviceId,
        session: { ...mockSession, processName: `old${i}.exe` },
        bufferedAt: new Date(Date.UTC(2024, 0, 1, 10 + i, 0, 0)).toISOString(),
      }))

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(existingBuffer))

      // Add new sessions
      const newSessions: UsageSession[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockSession,
        processName: `new${i}.exe`,
      }))

      await bufferSessions(mockDeviceId, newSessions)

      // Verify buffer was trimmed
      const writeCall = mockFs.writeFile.mock.calls[0]
      if (writeCall) {
        const writtenData = JSON.parse(writeCall[1] as string)
        expect(writtenData.length).toBeLessThanOrEqual(MAX_BUFFER_SIZE)
        // Newest entries should be kept
        const lastEntry = writtenData[writtenData.length - 1]
        expect(lastEntry.session.processName).toContain('new')
      }
    })
  })
})
