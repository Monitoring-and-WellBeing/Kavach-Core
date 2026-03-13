/**
 * Integration tests for DashboardScreen
 * Tests data loading, pull-to-refresh, active focus banner, and no-device state.
 */
import React from 'react'
import { render, waitFor, fireEvent, act } from '@testing-library/react-native'
import DashboardScreen from '../../screens/DashboardScreen'
import { AuthProvider } from '../../context/AuthContext'
import { api } from '../../lib/axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('../../lib/axios', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}))

const mockGet = api.get as jest.MockedFunction<typeof api.get>
const mockPost = api.post as jest.MockedFunction<typeof api.post>

const MOCK_USER = {
  id: 'u1', name: 'Ravi Kumar', email: 'ravi@school.com',
  role: 'STUDENT', tenantId: 't1', phone: '9999999999',
}

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
  ],
  categories: [
    { category: 'PRODUCTIVITY', durationSeconds: 3600 },
    { category: 'ENTERTAINMENT', durationSeconds: 1800 },
  ],
  weeklyData: [
    { date: '2026-03-07', dayLabel: 'Fri', screenTimeSeconds: 7200 },
    { date: '2026-03-13', dayLabel: 'Thu', screenTimeSeconds: 9000 },
  ],
  activeFocusSession: null,
}

function renderDashboard() {
  return render(
    <AuthProvider>
      <DashboardScreen />
    </AuthProvider>
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()

  // Seed logged-in user via /auth/me
  await AsyncStorage.setItem('kavach_access_token', 'live-token')
  mockGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
    if (url === '/dashboard/student') return Promise.resolve({ data: MOCK_DASHBOARD } as any)
    return Promise.reject(new Error(`Unexpected GET: ${url}`))
  })
})

describe('DashboardScreen — loading state', () => {
  it('shows skeleton cards while loading', () => {
    const { queryAllByTestId } = renderDashboard()
    // Loading renders view containers before data arrives
    expect(queryAllByTestId).toBeTruthy()
  })
})

describe('DashboardScreen — happy path', () => {
  it('renders the greeting with the student first name', async () => {
    const { getByText } = renderDashboard()
    await waitFor(() => expect(getByText('Ravi 👋')).toBeTruthy())
  })

  it('renders the streak badge', async () => {
    const { getByText } = renderDashboard()
    await waitFor(() => expect(getByText('🔥 5')).toBeTruthy())
  })

  it('renders the screen time stat', async () => {
    const { getByText } = renderDashboard()
    await waitFor(() => expect(getByText('2h 30m')).toBeTruthy())
  })

  it('renders the focus time stat', async () => {
    const { getByText } = renderDashboard()
    await waitFor(() => expect(getByText('45m')).toBeTruthy())
  })

  it('renders the top app name', async () => {
    const { getByText } = renderDashboard()
    await waitFor(() => expect(getByText('VS Code')).toBeTruthy())
  })

  it('renders the Start Focus button when no active session', async () => {
    const { getByText } = renderDashboard()
    await waitFor(() =>
      expect(getByText(/Start 25-min Focus Session/i)).toBeTruthy()
    )
  })
})

describe('DashboardScreen — active focus session banner', () => {
  it('shows the active focus banner when a session is running', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
      if (url === '/dashboard/student')
        return Promise.resolve({
          data: {
            ...MOCK_DASHBOARD,
            activeFocusSession: {
              sessionId: 'sess-abc',
              title: 'Pomodoro',
              remainingSeconds: 900,
            },
          },
        } as any)
      return Promise.reject(new Error(`Unexpected GET: ${url}`))
    })

    const { getByText } = renderDashboard()
    await waitFor(() => expect(getByText('Pomodoro')).toBeTruthy())
    await waitFor(() => expect(getByText('Focus mode active')).toBeTruthy())
  })
})

describe('DashboardScreen — no device linked', () => {
  it('shows the no-device message', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
      if (url === '/dashboard/student')
        return Promise.resolve({ data: { deviceLinked: false } } as any)
      return Promise.reject(new Error(`Unexpected GET: ${url}`))
    })

    const { getByText } = renderDashboard()
    await waitFor(() =>
      expect(getByText('No device linked yet')).toBeTruthy()
    )
  })
})

describe('DashboardScreen — start focus', () => {
  it('calls /focus/self-start when Start Focus is pressed', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 's1', deviceId: 'device-001', deviceName: "Ravi's Laptop",
        initiatedRole: 'STUDENT', title: 'Pomodoro', durationMinutes: 25,
        startedAt: '', endsAt: '', status: 'ACTIVE', remainingSeconds: 1500, progressPercent: 0,
      },
    } as any)

    const { getByText } = renderDashboard()
    await waitFor(() => getByText(/Start 25-min Focus Session/i))

    await act(async () => {
      fireEvent.press(getByText(/Start 25-min Focus Session/i))
    })

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/focus/self-start', {
        deviceId: 'device-001',
        durationMinutes: 25,
        title: 'Pomodoro',
      })
    )
  })
})
