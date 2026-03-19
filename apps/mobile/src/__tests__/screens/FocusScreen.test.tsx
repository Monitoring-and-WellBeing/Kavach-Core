/**
 * Integration tests for FocusScreen
 * Tests preset selection, starting/stopping a session, history display.
 */
import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import FocusScreen from '../../screens/FocusScreen'
import { AuthProvider } from '../../context/AuthContext'
import { api } from '../../lib/axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('../../lib/axios', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}))

const mockGet = api.get as jest.MockedFunction<typeof api.get>
const mockPost = api.post as jest.MockedFunction<typeof api.post>

const MOCK_USER = {
  id: 'u1', name: 'Dev Student', email: 'dev@school.com',
  role: 'STUDENT', tenantId: 't1', phone: '',
}

const MOCK_DASHBOARD_WITH_DEVICE = {
  deviceLinked: true,
  deviceId: 'device-xyz',
  deviceName: 'Test Phone',
  focusScore: 80,
  streak: 3,
  stats: { screenTimeSeconds: 0, screenTimeFormatted: '0m', focusMinutesToday: 0, focusSessionsToday: 0 },
  topApps: [],
  categories: [],
  weeklyData: [],
  activeFocusSession: null,
}

const MOCK_SESSION = {
  id: 'sess-001',
  deviceId: 'device-xyz',
  deviceName: 'Test Phone',
  initiatedRole: 'STUDENT' as const,
  title: 'Pomodoro',
  durationMinutes: 25,
  startedAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 25 * 60_000).toISOString(),
  status: 'ACTIVE' as const,
  remainingSeconds: 1500,
  progressPercent: 0,
}

function renderFocus() {
  return render(
    <AuthProvider>
      <FocusScreen />
    </AuthProvider>
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
  jest.useFakeTimers({ advanceTimers: true })

  await AsyncStorage.setItem('kavach_access_token', 'live-token')

  mockGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
    if (url === '/dashboard/student') return Promise.resolve({ data: MOCK_DASHBOARD_WITH_DEVICE } as any)
    if (url.includes('/active')) return Promise.reject(new Error('no active'))
    if (url.includes('/history')) return Promise.resolve({ data: [] } as any)
    if (url.includes('/stats/today')) return Promise.resolve({ data: { focusMinutesToday: 0, sessionsToday: 0 } } as any)
    return Promise.reject(new Error(`Unexpected GET: ${url}`))
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('FocusScreen — idle state', () => {
  it('renders all 4 preset cards', async () => {
    const { getByText } = renderFocus()
    await waitFor(() => {
      expect(getByText('25 min')).toBeTruthy()
      expect(getByText('45 min')).toBeTruthy()
      expect(getByText('60 min')).toBeTruthy()
      expect(getByText('90 min')).toBeTruthy()
    })
  })

  it('renders Pomodoro and Study block descriptions', async () => {
    const { getByText } = renderFocus()
    await waitFor(() => {
      expect(getByText('Pomodoro')).toBeTruthy()
      expect(getByText('Study block')).toBeTruthy()
    })
  })

  it('renders the Start Focus button', async () => {
    const { getByText } = renderFocus()
    await waitFor(() => expect(getByText(/Start 25-min Focus/i)).toBeTruthy())
  })

  it('renders the stats summary (0 sessions · 0 min)', async () => {
    const { getByText } = renderFocus()
    await waitFor(() => expect(getByText(/0 sessions/i)).toBeTruthy())
  })
})

describe('FocusScreen — starting a session', () => {
  it('calls /focus/self-start with correct payload', async () => {
    mockPost.mockResolvedValueOnce({ data: MOCK_SESSION } as any)

    const { getByText } = renderFocus()
    await waitFor(() => getByText(/Start 25-min Focus/i))

    await act(async () => {
      fireEvent.press(getByText(/Start 25-min Focus/i))
    })

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/focus/self-start', {
        deviceId: 'device-xyz',
        durationMinutes: 25,
        title: 'Pomodoro',
      })
    )
  })

  it('shows the circular timer after session starts', async () => {
    mockPost.mockResolvedValueOnce({ data: MOCK_SESSION } as any)

    const { getByText } = renderFocus()
    await waitFor(() => getByText(/Start 25-min Focus/i))

    await act(async () => {
      fireEvent.press(getByText(/Start 25-min Focus/i))
    })

    await waitFor(() => expect(getByText(/remaining/i)).toBeTruthy())
  })
})

describe('FocusScreen — preset selection', () => {
  it('changes the start button label when a different preset is selected', async () => {
    const { getByText } = renderFocus()
    await waitFor(() => getByText('45 min'))

    fireEvent.press(getByText('45 min'))
    await waitFor(() =>
      expect(getByText(/Start 45-min Focus/i)).toBeTruthy()
    )
  })
})

describe('FocusScreen — ending a session', () => {
  it('calls /focus/{sessionId}/stop when End Session Early is pressed', async () => {
    mockPost
      .mockResolvedValueOnce({ data: MOCK_SESSION } as any) // selfStart
      .mockResolvedValueOnce({ data: { ...MOCK_SESSION, status: 'CANCELLED' } } as any) // stop

    const { getByText } = renderFocus()
    await waitFor(() => getByText(/Start 25-min Focus/i))

    await act(async () => { fireEvent.press(getByText(/Start 25-min Focus/i)) })
    // The button renders "■  End Session Early" with a stop character prefix
    await waitFor(() => getByText(/End Session Early/i))

    await act(async () => { fireEvent.press(getByText(/End Session Early/i)) })

    await waitFor(() =>
      expect(mockPost).toHaveBeenLastCalledWith(`/focus/${MOCK_SESSION.id}/stop`)
    )
  })
})

describe('FocusScreen — no device linked', () => {
  it('shows no-device message when device is not linked', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
      if (url === '/dashboard/student')
        return Promise.resolve({ data: { deviceLinked: false } } as any)
      return Promise.reject(new Error(`Unexpected GET: ${url}`))
    })

    const { getByText } = renderFocus()
    await waitFor(() => expect(getByText('No device linked yet')).toBeTruthy())
  })
})

describe('FocusScreen — session history', () => {
  it('shows recent sessions when history is returned', async () => {
    const pastSession = {
      ...MOCK_SESSION,
      id: 'past-001',
      status: 'COMPLETED' as const,
      startedAt: '2026-03-12T09:00:00Z',
      title: 'Deep work',
    }

    mockGet.mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
      if (url === '/dashboard/student') return Promise.resolve({ data: MOCK_DASHBOARD_WITH_DEVICE } as any)
      if (url.includes('/active')) return Promise.reject(new Error('none'))
      if (url.includes('/history')) return Promise.resolve({ data: [pastSession] } as any)
      if (url.includes('/stats/today')) return Promise.resolve({ data: { focusMinutesToday: 25, sessionsToday: 1 } } as any)
      return Promise.reject(new Error(`Unexpected: ${url}`))
    })

    const { getAllByText, getByText } = renderFocus()
    // 'Deep work' may appear in both the 60-min preset label AND the history card title
    await waitFor(() => expect(getAllByText('Deep work').length).toBeGreaterThanOrEqual(1))
    await waitFor(() => expect(getByText(/Completed/i)).toBeTruthy())
  })
})
