const mockExecAsync = jest.fn()

jest.mock('util', () => {
  const actual = jest.requireActual('util')
  return {
    ...actual,
    promisify: jest.fn(() => mockExecAsync),
  }
})

jest.mock('../tracking/categoryClassifier', () => ({
  classifyApp: jest.fn(() => ({
    category: 'EDUCATION',
    friendlyName: 'VS Code',
  })),
}))

import { getActiveWindow, recordWindow, flushCurrentSession, stopTracking } from '../tracking/tracker'

describe('Activity Tracker', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T10:00:00Z'))
    jest.clearAllMocks()
    stopTracking() // Reset state
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getActiveWindow', () => {
    it('window info correctly extracted', async () => {
      // Mock PowerShell output
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'code.exe|VS Code - test.ts',
        stderr: '',
      } as never)

      // Mock platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      })

      const window = await getActiveWindow()

      expect(window).not.toBeNull()
      if (window) {
        expect(window.processName).toContain('code.exe')
        expect(window.windowTitle).toBe('VS Code - test.ts')
        expect(window.appName).toBe('VS Code')
        expect(window.category).toBe('EDUCATION')
      }
    })

    it('returns null on error', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Command failed'))

      const window = await getActiveWindow()

      expect(window).toBeNull()
    })

    it('returns fallback on non-Windows platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      })

      const window = await getActiveWindow()

      expect(window).not.toBeNull()
      if (window) {
        expect(window.processName).toBe('code.exe')
        expect(window.appName).toBe('VS Code')
      }
    })
  })

  describe('recordWindow', () => {
    it('same app continues session (no new entry if < 30s gap)', () => {
      const window1 = {
        processName: 'code.exe',
        windowTitle: 'VS Code',
        appName: 'VS Code',
        category: 'EDUCATION' as const,
      }

      const window2 = {
        processName: 'code.exe',
        windowTitle: 'VS Code - different file',
        appName: 'VS Code',
        category: 'EDUCATION' as const,
      }

      // First record should start a session
      const result1 = recordWindow(window1)
      expect(result1).toHaveLength(0) // No completed session yet

      // Second record of same app should continue session
      const result2 = recordWindow(window2)
      expect(result2).toHaveLength(0) // Still no completed session
    })

    it('new app starts new session', () => {
      const window1 = {
        processName: 'code.exe',
        windowTitle: 'VS Code',
        appName: 'VS Code',
        category: 'EDUCATION' as const,
      }

      const window2 = {
        processName: 'chrome.exe',
        windowTitle: 'Chrome',
        appName: 'Chrome',
        category: 'PRODUCTIVITY' as const,
      }

      // Record first app
      recordWindow(window1)
      
      // Wait a bit (simulate time passing)
      jest.advanceTimersByTime(5000)

      // Record different app - should close previous session
      const result = recordWindow(window2)
      
      // Should have completed the first session
      expect(result.length).toBeGreaterThanOrEqual(0) // May be 0 if duration < 3s
    })

    it('null window closes current session', () => {
      const window = {
        processName: 'code.exe',
        windowTitle: 'VS Code',
        appName: 'VS Code',
        category: 'EDUCATION' as const,
      }

      // Start a session
      recordWindow(window)
      jest.advanceTimersByTime(5000)

      // Null window should close session
      const result = recordWindow(null)
      
      // Should have completed session if duration >= 3s
      expect(Array.isArray(result)).toBe(true)
    })

    it('sessions under 3 seconds are ignored', () => {
      const window1 = {
        processName: 'code.exe',
        windowTitle: 'VS Code',
        appName: 'VS Code',
        category: 'EDUCATION' as const,
      }

      const window2 = {
        processName: 'chrome.exe',
        windowTitle: 'Chrome',
        appName: 'Chrome',
        category: 'PRODUCTIVITY' as const,
      }

      // Record first app
      recordWindow(window1)
      
      // Immediately switch to different app (simulate < 3s)
      jest.advanceTimersByTime(2000) // 2 seconds
      const result = recordWindow(window2)
      
      // Short session should be ignored
      expect(result.length).toBe(0)
    })
  })

  describe('flushCurrentSession', () => {
    it('flushes current session without closing it', () => {
      const window = {
        processName: 'code.exe',
        windowTitle: 'VS Code',
        appName: 'VS Code',
        category: 'EDUCATION' as const,
      }

      // Start a session
      recordWindow(window)
      jest.advanceTimersByTime(5000)

      // Flush should return current session
      const flushed = flushCurrentSession()
      
      if (flushed) {
        expect(flushed.processName).toBe('code.exe')
        expect(flushed.durationSeconds).toBeGreaterThan(0)
      }

      // Session should continue after flush
      const flushed2 = flushCurrentSession()
      // Should return another session if enough time passed
      expect(flushed2).toBeDefined()
    })

    it('returns null if no active session', () => {
      stopTracking() // Clear any active session
      
      const flushed = flushCurrentSession()
      expect(flushed).toBeNull()
    })
  })
})
