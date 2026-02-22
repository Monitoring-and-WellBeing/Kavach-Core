import { render, screen, waitFor } from '@testing-library/react'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { AuthProvider } from '@/context/AuthContext'
import { RouteGuard } from '@/components/auth/RouteGuard'

const BASE = 'http://localhost:8080/api/v1'

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

describe('Feature 12 — Route Guard', () => {

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    mockPush.mockClear()
    mockReplace.mockClear()
  })

  it('PARENT user can access /parent routes', async () => {
    localStorage.setItem('kavach_access_token', 'mock.token')

    server.use(
      rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
        res(ctx.json({
          id: '1',
          email: 'parent@demo.com',
          role: 'PARENT',
          name: 'Test Parent',
        }))
      )
    )

    render(
      <AuthProvider>
        <RouteGuard>
          <div>Parent Content</div>
        </RouteGuard>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Parent Content')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should not redirect
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('STUDENT user is redirected away from /parent routes', async () => {
    localStorage.setItem('kavach_access_token', 'mock.token')

    server.use(
      rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
        res(ctx.json({
          id: '2',
          email: 'student@demo.com',
          role: 'STUDENT',
          name: 'Test Student',
        }))
      )
    )

    // Mock pathname to /parent
    jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/parent')

    render(
      <AuthProvider>
        <RouteGuard>
          <div>Parent Content</div>
        </RouteGuard>
      </AuthProvider>
    )

    await waitFor(() => {
      // Should redirect to /student
      expect(mockReplace).toHaveBeenCalledWith('/student')
    }, { timeout: 3000 })
  })

  it('Unauthenticated user is redirected to /login', async () => {
    localStorage.removeItem('kavach_access_token')

    server.use(
      rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
        res(ctx.status(401))
      )
    )

    jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/parent')

    render(
      <AuthProvider>
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      </AuthProvider>
    )

    await waitFor(() => {
      // Should redirect to login
      expect(mockReplace).toHaveBeenCalledWith('/')
    }, { timeout: 3000 })
  })

  it('Token expiry (401 response) redirects to /login', async () => {
    localStorage.setItem('kavach_access_token', 'expired.token')

    server.use(
      rest.get(`${BASE}/auth/me`, (req, res, ctx) =>
        res(ctx.status(401), ctx.json({ message: 'Token expired' }))
      )
    )

    jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/parent')

    render(
      <AuthProvider>
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      </AuthProvider>
    )

    await waitFor(() => {
      // Should redirect to login on 401
      expect(mockReplace).toHaveBeenCalledWith('/')
    }, { timeout: 3000 })
  })

  it('shows loading state while checking auth', () => {
    localStorage.setItem('kavach_access_token', 'mock.token')

    server.use(
      rest.get(`${BASE}/auth/me`, async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return res(ctx.json({
          id: '1',
          email: 'parent@demo.com',
          role: 'PARENT',
        }))
      })
    )

    render(
      <AuthProvider>
        <RouteGuard>
          <div>Content</div>
        </RouteGuard>
      </AuthProvider>
    )

    // Should show loading spinner initially
    expect(screen.queryByRole('status') || screen.queryByText(/loading/i)).toBeTruthy()
  })
})
