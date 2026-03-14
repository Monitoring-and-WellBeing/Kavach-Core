/**
 * Unit tests for src/lib/focusApi.ts
 * Verifies that every API method calls the correct endpoint with correct params.
 */
import { focusApi, FocusSession } from '../../lib/focusApi'
import { api } from '../../lib/axios'

jest.mock('../../lib/axios', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const mockGet = api.get as jest.MockedFunction<typeof api.get>
const mockPost = api.post as jest.MockedFunction<typeof api.post>

const DEVICE_ID = 'device-abc'
const SESSION_ID = 'session-001'

const MOCK_SESSION: FocusSession = {
  id: SESSION_ID,
  deviceId: DEVICE_ID,
  deviceName: "Student's Phone",
  initiatedRole: 'STUDENT',
  title: 'Pomodoro',
  durationMinutes: 25,
  startedAt: '2026-03-13T10:00:00Z',
  endsAt: '2026-03-13T10:25:00Z',
  status: 'ACTIVE',
  remainingSeconds: 1200,
  progressPercent: 20,
}

afterEach(() => jest.clearAllMocks())

describe('focusApi.selfStart', () => {
  it('POSTs to /focus/self-start with correct payload', async () => {
    mockPost.mockResolvedValueOnce({ data: MOCK_SESSION } as any)
    await focusApi.selfStart(DEVICE_ID, 25, 'Pomodoro')
    expect(mockPost).toHaveBeenCalledWith('/focus/self-start', {
      deviceId: DEVICE_ID,
      durationMinutes: 25,
      title: 'Pomodoro',
    })
  })

  it('returns the created session', async () => {
    mockPost.mockResolvedValueOnce({ data: MOCK_SESSION } as any)
    const result = await focusApi.selfStart(DEVICE_ID, 25)
    expect(result.id).toBe(SESSION_ID)
    expect(result.status).toBe('ACTIVE')
    expect(result.remainingSeconds).toBe(1200)
  })

  it('works without optional title', async () => {
    mockPost.mockResolvedValueOnce({ data: MOCK_SESSION } as any)
    await focusApi.selfStart(DEVICE_ID, 45)
    expect(mockPost).toHaveBeenCalledWith('/focus/self-start', {
      deviceId: DEVICE_ID,
      durationMinutes: 45,
      title: undefined,
    })
  })
})

describe('focusApi.stop', () => {
  it('POSTs to /focus/{sessionId}/stop', async () => {
    const stoppedSession = { ...MOCK_SESSION, status: 'CANCELLED' as const }
    mockPost.mockResolvedValueOnce({ data: stoppedSession } as any)

    await focusApi.stop(SESSION_ID)
    expect(mockPost).toHaveBeenCalledWith(`/focus/${SESSION_ID}/stop`)
  })

  it('returns the updated session', async () => {
    const cancelled = { ...MOCK_SESSION, status: 'CANCELLED' as const }
    mockPost.mockResolvedValueOnce({ data: cancelled } as any)

    const result = await focusApi.stop(SESSION_ID)
    expect(result.status).toBe('CANCELLED')
  })
})

describe('focusApi.getActive', () => {
  it('GETs /focus/device/{deviceId}/active', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_SESSION } as any)
    await focusApi.getActive(DEVICE_ID)
    expect(mockGet).toHaveBeenCalledWith(`/focus/device/${DEVICE_ID}/active`)
  })

  it('returns the active session', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_SESSION } as any)
    const result = await focusApi.getActive(DEVICE_ID)
    expect(result).not.toBeNull()
    expect(result?.id).toBe(SESSION_ID)
  })

  it('returns null when API throws (no active session)', async () => {
    mockGet.mockRejectedValueOnce(new Error('404'))
    const result = await focusApi.getActive(DEVICE_ID)
    expect(result).toBeNull()
  })
})

describe('focusApi.getHistory', () => {
  it('GETs /focus/device/{deviceId}/history', async () => {
    mockGet.mockResolvedValueOnce({ data: [MOCK_SESSION] } as any)
    await focusApi.getHistory(DEVICE_ID)
    expect(mockGet).toHaveBeenCalledWith(`/focus/device/${DEVICE_ID}/history`)
  })

  it('returns array of sessions', async () => {
    const completed = { ...MOCK_SESSION, status: 'COMPLETED' as const }
    mockGet.mockResolvedValueOnce({ data: [completed, MOCK_SESSION] } as any)
    const result = await focusApi.getHistory(DEVICE_ID)
    expect(result).toHaveLength(2)
    expect(result[0].status).toBe('COMPLETED')
  })
})

describe('focusApi.getTodayStats', () => {
  it('GETs /focus/device/{deviceId}/stats/today', async () => {
    mockGet.mockResolvedValueOnce({
      data: { focusMinutesToday: 90, sessionsToday: 3 },
    } as any)
    await focusApi.getTodayStats(DEVICE_ID)
    expect(mockGet).toHaveBeenCalledWith(
      `/focus/device/${DEVICE_ID}/stats/today`
    )
  })

  it('returns today stats correctly', async () => {
    mockGet.mockResolvedValueOnce({
      data: { focusMinutesToday: 90, sessionsToday: 3 },
    } as any)
    const result = await focusApi.getTodayStats(DEVICE_ID)
    expect(result.focusMinutesToday).toBe(90)
    expect(result.sessionsToday).toBe(3)
  })
})
