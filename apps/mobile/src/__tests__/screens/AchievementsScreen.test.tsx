/**
 * Integration tests for AchievementsScreen
 * Tests XP bar, category filtering, badge grid, recently-earned section,
 * and badge detail modal.
 */
import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import AchievementsScreen from '../../screens/AchievementsScreen'
import { AuthProvider } from '../../context/AuthContext'
import { api } from '../../lib/axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('../../lib/axios', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}))

const mockGet = api.get as jest.MockedFunction<typeof api.get>

const MOCK_USER = {
  id: 'u1', name: 'Badge Student', email: 'badges@school.com',
  role: 'STUDENT', tenantId: 't1', phone: '',
}

const MOCK_DASHBOARD = {
  deviceLinked: true,
  deviceId: 'device-badges',
  deviceName: 'Badge Phone',
  focusScore: 60, streak: 2,
  stats: { screenTimeSeconds: 0, screenTimeFormatted: '0m', focusMinutesToday: 0, focusSessionsToday: 0 },
  topApps: [], categories: [], weeklyData: [], activeFocusSession: null,
}

const MOCK_BADGE_PROGRESS = {
  totalXp: 450,
  badgesEarned: 3,
  badgesTotal: 24,
  level: 'Explorer',
  levelProgress: 45,
  badges: [
    {
      id: 'b1', code: 'FIRST_FOCUS', name: 'First Focus', description: 'Complete first focus session',
      icon: '🎯', category: 'FOCUS' as const, tier: 'BRONZE' as const, xpReward: 50, earned: true,
      earnedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'b2', code: 'STREAK_7', name: '7-Day Streak', description: 'Maintain a 7-day streak',
      icon: '🔥', category: 'STREAK' as const, tier: 'SILVER' as const, xpReward: 100, earned: false,
    },
    {
      id: 'b3', code: 'FOCUS_MASTER', name: 'Focus Master', description: '10 focus sessions',
      icon: '⚡', category: 'FOCUS' as const, tier: 'GOLD' as const, xpReward: 200, earned: true,
      earnedAt: '2026-03-10T14:00:00Z',
    },
  ],
  recentlyEarned: [
    {
      id: 'b3', code: 'FOCUS_MASTER', name: 'Focus Master', description: '10 focus sessions',
      icon: '⚡', category: 'FOCUS' as const, tier: 'GOLD' as const, xpReward: 200, earned: true,
    },
  ],
  byCategory: { FOCUS: 2, STREAK: 0, USAGE: 1, REDUCTION: 0, MILESTONE: 0, SPECIAL: 0 },
}

function renderAchievements() {
  return render(
    <AuthProvider>
      <AchievementsScreen />
    </AuthProvider>
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
  await AsyncStorage.setItem('kavach_access_token', 'live-token')

  mockGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
    if (url === '/dashboard/student') return Promise.resolve({ data: MOCK_DASHBOARD } as any)
    if (url.includes('/badges/device/')) return Promise.resolve({ data: MOCK_BADGE_PROGRESS } as any)
    return Promise.reject(new Error(`Unexpected GET: ${url}`))
  })
})

describe('AchievementsScreen — page header', () => {
  it('renders the Achievements title', async () => {
    const { getByText } = renderAchievements()
    await waitFor(() => expect(getByText(/Achievements/i)).toBeTruthy())
  })

  it('shows earned / total badge count', async () => {
    const { getByText } = renderAchievements()
    await waitFor(() => expect(getByText('3 of 24 badges earned')).toBeTruthy())
  })
})

describe('AchievementsScreen — XP bar', () => {
  it('renders the level name', async () => {
    const { getByText } = renderAchievements()
    await waitFor(() => expect(getByText(/Explorer/)).toBeTruthy())
  })

  it('renders total XP', async () => {
    const { getByText } = renderAchievements()
    await waitFor(() => expect(getByText(/450 XP total/)).toBeTruthy())
  })

  it('renders the next level', async () => {
    const { getByText } = renderAchievements()
    await waitFor(() => expect(getByText(/Achiever/)).toBeTruthy())
  })
})

describe('AchievementsScreen — badge grid', () => {
  it('renders all badges initially', async () => {
    const { getByText, getAllByText } = renderAchievements()
    await waitFor(() => {
      expect(getByText('First Focus')).toBeTruthy()
      expect(getByText('7-Day Streak')).toBeTruthy()
      // 'Focus Master' appears in both grid AND recently-earned section
      expect(getAllByText('Focus Master').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('calls /badges/device/{deviceId} with the correct deviceId', async () => {
    renderAchievements()
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/badges/device/device-badges')
    )
  })
})

describe('AchievementsScreen — recently earned', () => {
  it('shows the Recently Earned section', async () => {
    const { getByText } = renderAchievements()
    await waitFor(() => expect(getByText(/Recently Earned/i)).toBeTruthy())
  })

  it('shows the recently earned badge name', async () => {
    const { getAllByText } = renderAchievements()
    // 'Focus Master' appears in both the recently-earned strip AND the main grid
    await waitFor(() =>
      expect(getAllByText('Focus Master').length).toBeGreaterThanOrEqual(1)
    )
  })
})

describe('AchievementsScreen — category filtering', () => {
  it('filters to FOCUS badges when the Focus chip is tapped', async () => {
    const { getByText, queryByText } = renderAchievements()
    await waitFor(() => getByText('Focus'))

    fireEvent.press(getByText('Focus'))

    await waitFor(() => {
      // FOCUS badges should still be visible
      expect(getByText('First Focus')).toBeTruthy()
      // STREAK badge should be hidden
      expect(queryByText('7-Day Streak')).toBeNull()
    })
  })

  it('shows all badges again when Show all is tapped', async () => {
    const { getByText, queryByText } = renderAchievements()
    await waitFor(() => getByText('Focus'))

    fireEvent.press(getByText('Focus'))
    await waitFor(() => queryByText('7-Day Streak') === null)

    fireEvent.press(getByText('Show all'))
    await waitFor(() => expect(getByText('7-Day Streak')).toBeTruthy())
  })
})

describe('AchievementsScreen — badge modal', () => {
  it('opens the detail modal when a badge is tapped', async () => {
    const { getByText, getAllByText } = renderAchievements()
    await waitFor(() => getByText('First Focus'))

    // Tap the First Focus badge card
    fireEvent.press(getAllByText('First Focus')[0])

    await waitFor(() =>
      expect(getByText('Complete first focus session')).toBeTruthy()
    )
  })

  it('closes the modal when Close is pressed', async () => {
    const { getByText, getAllByText, queryByText } = renderAchievements()
    await waitFor(() => getByText('First Focus'))

    fireEvent.press(getAllByText('First Focus')[0])
    await waitFor(() => getByText('Close'))

    fireEvent.press(getByText('Close'))
    await waitFor(() =>
      expect(queryByText('Complete first focus session')).toBeNull()
    )
  })
})

describe('AchievementsScreen — no device', () => {
  it('shows no-device message when device is not linked', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ data: MOCK_USER } as any)
      if (url === '/dashboard/student')
        return Promise.resolve({ data: { deviceLinked: false } } as any)
      return Promise.reject(new Error(`Unexpected GET: ${url}`))
    })

    const { getByText } = renderAchievements()
    await waitFor(() => expect(getByText('No device linked yet')).toBeTruthy())
  })
})
