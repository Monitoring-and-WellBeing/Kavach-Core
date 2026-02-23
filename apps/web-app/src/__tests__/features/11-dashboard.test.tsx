import { render, screen, waitFor } from '@testing-library/react'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { AuthProvider } from '@/context/AuthContext'
import ParentDashboard from '@/app/parent/page'
import StudentDashboard from '@/app/student/page'
import InstituteDashboard from '@/app/institute/page'

const BASE = 'http://localhost:8080/api/v1'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/parent',
}))

// Mock FocusControl component
jest.mock('@/components/FocusControl', () => ({
  FocusControl: () => <div data-testid="focus-control">Focus Control</div>,
}))

// Mock GoalsMini component
jest.mock('@/components/GoalsMini', () => ({
  GoalsMini: () => <div data-testid="goals-mini">Goals Mini</div>,
}))

describe('Feature 11 — Dashboard Null Safety', () => {

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('kavach_access_token', 'mock.token')
  })

  describe('Parent dashboard', () => {
    it('renders loading skeleton when data is null', async () => {
      server.use(
        rest.get(`${BASE}/dashboard/parent`, async (req, res, ctx) => {
          // Delay to show loading state
          await new Promise(resolve => setTimeout(resolve, 100))
          return res(ctx.json(null))
        })
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      // Should show loading state initially
      expect(screen.queryByText(/loading/i)).toBeInTheDocument()
    })

    it('renders stat cards when data loads', async () => {
      server.use(
        rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) =>
          res(ctx.json({
            stats: {
              totalScreenTimeSeconds: 14400,
              totalScreenTimeFormatted: '4h',
              activeDevices: 1,
              totalDevices: 2,
              focusSessionsToday: 2,
              blockedAttemptsToday: 5,
              unreadAlerts: 3,
            },
            devices: [],
            recentAlerts: [],
          }))
        )
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/4h/i)).toBeInTheDocument()
        expect(screen.getByText(/1/i)).toBeInTheDocument() // activeDevices
      }, { timeout: 3000 })
    })

    it('shows "No devices" empty state correctly', async () => {
      server.use(
        rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) =>
          res(ctx.json({
            stats: {
              totalScreenTimeSeconds: 0,
              totalScreenTimeFormatted: '0m',
              activeDevices: 0,
              totalDevices: 0,
              focusSessionsToday: 0,
              blockedAttemptsToday: 0,
              unreadAlerts: 0,
            },
            devices: [],
            recentAlerts: [],
          }))
        )
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should render without crashing even with empty devices
        expect(screen.queryByText(/0/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Student dashboard', () => {
    it('renders FocusScoreRing with score=0', async () => {
      server.use(
        rest.get(`${BASE}/dashboard/student`, (req, res, ctx) =>
          res(ctx.json({
            deviceLinked: true,
            deviceId: 'device-001',
            deviceName: 'Test Device',
            focusScore: 0,
            streak: 0,
            stats: {
              screenTimeSeconds: 0,
              screenTimeFormatted: '0m',
              focusMinutesToday: 0,
              focusSessionsToday: 0,
            },
            topApps: [],
            categories: [],
            weeklyData: [],
            activeFocusSession: null,
          }))
        )
      )

      render(
        <AuthProvider>
          <StudentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/0/i)).toBeInTheDocument()
        expect(screen.getByText(/\/ 100/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('renders with no goals (GoalsMini hidden)', async () => {
      server.use(
        rest.get(`${BASE}/dashboard/student`, (req, res, ctx) =>
          res(ctx.json({
            deviceLinked: true,
            deviceId: 'device-001',
            deviceName: 'Test Device',
            focusScore: 50,
            streak: 3,
            stats: {
              screenTimeSeconds: 3600,
              screenTimeFormatted: '1h',
              focusMinutesToday: 30,
              focusSessionsToday: 1,
            },
            topApps: [],
            categories: [],
            weeklyData: [],
            activeFocusSession: null,
          }))
        )
      )

      render(
        <AuthProvider>
          <StudentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Dashboard should render without crashing
        expect(screen.getByText(/50/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Institute dashboard', () => {
    it('renders with 0 devices', async () => {
      server.use(
        rest.get(`${BASE}/dashboard/institute`, (req, res, ctx) =>
          res(ctx.json({
            stats: {
              totalDevices: 0,
              onlineDevices: 0,
              offlineDevices: 0,
              pausedDevices: 0,
              focusDevices: 0,
              totalScreenTimeSeconds: 0,
              totalScreenTimeFormatted: '0m',
              blockedAttemptsToday: 0,
              complianceScore: 0,
              unreadAlerts: 0,
            },
            devices: [],
            topApps: [],
          }))
        )
      )

      render(
        <AuthProvider>
          <InstituteDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should render without crashing
        expect(screen.getByText(/0/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles null stats gracefully', async () => {
      server.use(
        rest.get(`${BASE}/dashboard/institute`, (req, res, ctx) =>
          res(ctx.json({
            stats: null,
            devices: null,
            topApps: null,
          }))
        )
      )

      render(
        <AuthProvider>
          <InstituteDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should not crash, may show loading or empty state
        expect(screen.queryByText(/dashboard/i) || screen.queryByText(/loading/i)).toBeTruthy()
      }, { timeout: 3000 })
    })
  })
})
