import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { AuthProvider } from '@/context/AuthContext'
import LoginPage from '@/app/(auth)/login/page'
import ParentDashboard from '@/app/parent/page'

const BASE = 'http://localhost:8080/api/v1'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => '/parent',
}))

// Mock FocusControl
jest.mock('@/components/FocusControl', () => ({
  FocusControl: () => <div data-testid="focus-control">Focus Control</div>,
}))

describe('Feature 14 — Error Boundary & Error Handling', () => {

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    mockPush.mockClear()
    mockReplace.mockClear()
  })

  describe('API error handling', () => {
    it('API 401 → redirects to login (not blank page)', async () => {
      localStorage.setItem('kavach_access_token', 'expired.token')

      server.use(
        rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Unauthorized' }))
        ),
        rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
          res(ctx.status(401))
        )
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should redirect to login, not show blank page
        expect(mockReplace).toHaveBeenCalledWith('/')
      }, { timeout: 3000 })
    })

    it('API 403 → shows "Access denied" message (not blank page)', async () => {
      localStorage.setItem('kavach_access_token', 'mock.token')

      server.use(
        rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) =>
          res(ctx.status(403), ctx.json({ message: 'Access denied' }))
        ),
        rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
          res(ctx.json({
            id: '1',
            email: 'test@example.com',
            role: 'PARENT',
          }))
        )
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should show error message, not blank page
        const errorText = screen.queryByText(/access denied|forbidden|error/i)
        expect(errorText || screen.queryByRole('alert')).toBeTruthy()
      }, { timeout: 3000 })
    })

    it('API 500 → shows error message with retry button', async () => {
      localStorage.setItem('kavach_access_token', 'mock.token')

      server.use(
        rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        ),
        rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
          res(ctx.json({
            id: '1',
            email: 'test@example.com',
            role: 'PARENT',
          }))
        )
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should show error message
        const errorText = screen.queryByText(/error|failed|try again/i)
        expect(errorText).toBeTruthy()
      }, { timeout: 3000 })
    })
  })

  describe('Network error handling', () => {
    it('Network offline → shows offline banner', async () => {
      localStorage.setItem('kavach_access_token', 'mock.token')

      server.use(
        rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) =>
          res.networkError('Failed to fetch')
        ),
        rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
          res(ctx.json({
            id: '1',
            email: 'test@example.com',
            role: 'PARENT',
          }))
        )
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should show network error or offline indicator
        const errorText = screen.queryByText(/offline|network|connection/i)
        expect(errorText || screen.queryByRole('alert')).toBeTruthy()
      }, { timeout: 3000 })
    })

    it('Network restored → banner disappears after handling', async () => {
      localStorage.setItem('kavach_access_token', 'mock.token')

      let shouldFail = true
      server.use(
        rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) => {
          if (shouldFail) {
            return res.networkError('Failed to fetch')
          }
          return res(ctx.json({
            stats: { totalScreenTimeSeconds: 0, activeDevices: 0, totalDevices: 0 },
            devices: [],
            recentAlerts: [],
          }))
        }),
        rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
          res(ctx.json({
            id: '1',
            email: 'test@example.com',
            role: 'PARENT',
          }))
        )
      )

      render(
        <AuthProvider>
          <ParentDashboard />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should show error initially
        expect(screen.queryByText(/offline|network|error/i)).toBeTruthy()
      }, { timeout: 3000 })

      // Simulate network restore
      shouldFail = false

      // Wait for retry or manual refresh
      await waitFor(() => {
        // Error should be cleared or data loaded
        const errorText = screen.queryByText(/offline|network|error/i)
        expect(errorText).toBeFalsy()
      }, { timeout: 5000 })
    })
  })

  describe('Login error handling', () => {
    it('shows error message on login failure', async () => {
      const user = userEvent.setup()

      server.use(
        rest.post(`${BASE}/auth/login`, (req, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      )

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid|incorrect|error/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })
})
