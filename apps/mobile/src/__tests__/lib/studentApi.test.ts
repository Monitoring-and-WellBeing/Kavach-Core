/**
 * Unit tests for src/lib/studentApi.ts
 * Verifies API calls hit the correct endpoints and return typed data.
 */
import { studentDashboardApi, CAT_COLORS, CAT_LABELS } from '../../lib/studentApi'
import { api } from '../../lib/axios'

jest.mock('../../lib/axios', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const mockGet = api.get as jest.MockedFunction<typeof api.get>

const MOCK_DASHBOARD = {
  deviceLinked: true,
  deviceId: 'device-001',
  deviceName: "Ravi's Laptop",
  focusScore: 78,
  streak: 5,
  stats: {
    screenTimeSeconds: 9000,
    screenTimeFormatted: '2h 30m',
    focusMinutesToday: 45,
    focusSessionsToday: 2,
  },
  topApps: [
    { appName: 'VS Code', category: 'PRODUCTIVITY', durationSeconds: 3600 },
    { appName: 'YouTube', category: 'ENTERTAINMENT', durationSeconds: 1800 },
  ],
  categories: [
    { category: 'PRODUCTIVITY', durationSeconds: 3600 },
    { category: 'ENTERTAINMENT', durationSeconds: 1800 },
  ],
  weeklyData: [
    { date: '2026-03-07', dayLabel: 'Fri', screenTimeSeconds: 7200 },
    { date: '2026-03-08', dayLabel: 'Sat', screenTimeSeconds: 5400 },
  ],
  activeFocusSession: null,
}

describe('studentDashboardApi.get', () => {
  afterEach(() => jest.clearAllMocks())

  it('calls GET /dashboard/student', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_DASHBOARD } as any)
    await studentDashboardApi.get()
    expect(mockGet).toHaveBeenCalledWith('/dashboard/student')
  })

  it('returns the data from the response', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_DASHBOARD } as any)
    const result = await studentDashboardApi.get()
    expect(result.focusScore).toBe(78)
    expect(result.streak).toBe(5)
    expect(result.stats.screenTimeFormatted).toBe('2h 30m')
    expect(result.deviceLinked).toBe(true)
    expect(result.activeFocusSession).toBeNull()
  })

  it('returns active focus session when one exists', async () => {
    const dashWithSession = {
      ...MOCK_DASHBOARD,
      activeFocusSession: {
        sessionId: 'sess-xyz',
        title: 'Pomodoro',
        remainingSeconds: 900,
      },
    }
    mockGet.mockResolvedValueOnce({ data: dashWithSession } as any)
    const result = await studentDashboardApi.get()
    expect(result.activeFocusSession).not.toBeNull()
    expect(result.activeFocusSession?.sessionId).toBe('sess-xyz')
    expect(result.activeFocusSession?.remainingSeconds).toBe(900)
  })

  it('propagates errors from the API', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'))
    await expect(studentDashboardApi.get()).rejects.toThrow('Network Error')
  })
})

describe('CAT_COLORS', () => {
  it('has color entries for all major categories', () => {
    expect(CAT_COLORS.EDUCATION).toBe('#3B82F6')
    expect(CAT_COLORS.GAMING).toBe('#EF4444')
    expect(CAT_COLORS.PRODUCTIVITY).toBe('#22C55E')
    expect(CAT_COLORS.OTHER).toBe('#9CA3AF')
  })
})

describe('CAT_LABELS', () => {
  it('maps category keys to display labels', () => {
    expect(CAT_LABELS.EDUCATION).toBe('Education')
    expect(CAT_LABELS.SOCIAL_MEDIA).toBe('Social')
    expect(CAT_LABELS.GAMING).toBe('Gaming')
  })
})
