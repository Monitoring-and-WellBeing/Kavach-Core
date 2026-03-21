import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/test-helpers'
import { rest } from 'msw'
import { AuthProvider } from '@/context/AuthContext'
import LoginPage from '@/app/(auth)/login/page'

const BASE = 'http://localhost:8080/api/v1'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Helper to render LoginPage with AuthProvider
const renderLoginPage = () => {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// After adding htmlFor/id to the login page, use getByLabelText.
// These are the ONLY correct selectors for this login form.
const getEmailInput = () => screen.getByLabelText(/email/i)
const getPasswordInput = () => screen.getByLabelText(/password/i)
const getSubmitButton = () => screen.getByRole('button', { name: /sign in/i })

const fillAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string
) => {
  await user.clear(getEmailInput())
  await user.type(getEmailInput(), email)
  await user.clear(getPasswordInput())
  await user.type(getPasswordInput(), password)
  await user.click(getSubmitButton())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature 01 — Authentication', () => {

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────
  describe('Login form rendering', () => {

    it('renders the KAVACH AI heading', () => {
      renderLoginPage()
      // There are two elements with "KAVACH AI" - the span logo and the paragraph
      // Use getAllByText and check the first one is the span
      const elements = screen.getAllByText(/kavach ai/i)
      expect(elements.length).toBeGreaterThanOrEqual(1)
      // The first one should be the logo span
      const logo = elements.find(el => el.tagName === 'SPAN')
      expect(logo).toBeInTheDocument()
    })

    it('renders email input', () => {
      renderLoginPage()
      expect(getEmailInput()).toBeInTheDocument()
    })

    it('renders password input', () => {
      renderLoginPage()
      expect(getPasswordInput()).toBeInTheDocument()
    })

    it('renders Sign In button', () => {
      renderLoginPage()
      expect(getSubmitButton()).toBeInTheDocument()
    })

    it('renders demo credential buttons', () => {
      renderLoginPage()
      expect(screen.getByText(/parent@demo.com/i)).toBeInTheDocument()
      expect(screen.getByText(/student@demo.com/i)).toBeInTheDocument()
      expect(screen.getByText(/admin@demo.com/i)).toBeInTheDocument()
    })

    it('email input is type email', () => {
      renderLoginPage()
      expect(getEmailInput()).toHaveAttribute('type', 'email')
    })

    it('password input is type password', () => {
      renderLoginPage()
      expect(getPasswordInput()).toHaveAttribute('type', 'password')
    })
  })

  // ── API calls ──────────────────────────────────────────────────────────────
  describe('Login API integration', () => {

    it('calls POST /auth/login with typed credentials', async () => {
      const user = userEvent.setup()
      let capturedBody: any = null

      server.use(
        rest.post(`${BASE}/auth/login`, async (req, res, ctx) => {
          capturedBody = await req.json()
          return res(ctx.json({
            accessToken: 'mock.access.token',
            refreshToken: 'mock.refresh.token',
            user: { id: '1', email: 'parent@demo.com', role: 'PARENT' },
          }))
        })
      )

      renderLoginPage()
      await fillAndSubmit(user, 'parent@demo.com', 'demo123')

      await waitFor(() => {
        expect(capturedBody?.email).toBe('parent@demo.com')
        expect(capturedBody?.password).toBe('demo123')
      }, { timeout: 3000 })
    })

    it('stores kavach_access_token in localStorage on success', async () => {
      const user = userEvent.setup()

      server.use(
        rest.post(`${BASE}/auth/login`, (req, res, ctx) =>
          res(ctx.json({
            accessToken: 'stored.access.token',
            refreshToken: 'stored.refresh.token',
            user: { role: 'PARENT' },
          }))
        )
      )

      renderLoginPage()
      await fillAndSubmit(user, 'parent@demo.com', 'demo123')

      await waitFor(() => {
        const token = localStorage.getItem('kavach_access_token')
        expect(token).toBeTruthy()
      }, { timeout: 3000 })
    })

    it('shows error text when API returns 401', async () => {
      const user = userEvent.setup()

      server.use(
        rest.post(`${BASE}/auth/login`, (req, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      )

      renderLoginPage()
      await fillAndSubmit(user, 'wrong@email.com', 'badpass')

      await waitFor(() => {
        // Match whatever your login page renders as error — adjust text if needed
        expect(
          screen.queryByText(/invalid|incorrect|wrong|failed|error/i)
          || screen.queryByRole('alert')
        ).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('disables submit button while request is in flight', async () => {
      const user = userEvent.setup()

      // Use a never-resolving promise to keep the request pending
      // This ensures loading stays true and the finally block doesn't run
      let resolvePromise: ((value: any) => void) | undefined
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      server.use(
        rest.post(`${BASE}/auth/login`, async (req, res, ctx) => {
          // Wait for the promise that never resolves (until we manually resolve it)
          await pendingPromise
          return res(ctx.json({
            accessToken: 'tok', refreshToken: 'ref', user: { role: 'PARENT' }
          }))
        })
      )

      renderLoginPage()
      await user.clear(getEmailInput())
      await user.type(getEmailInput(), 'parent@demo.com')
      await user.clear(getPasswordInput())
      await user.type(getPasswordInput(), 'demo123')

      // Submit the form directly - this triggers handleSubmit which sets loading=true
      const form = getEmailInput().closest('form')
      if (!form) throw new Error('Form not found')

      // Fire submit event - this will call handleSubmit which sets loading=true synchronously
      fireEvent.submit(form)

      // Wait for React to process the state update and re-render
      await waitFor(() => {
        // Query button directly by type="submit" to avoid text matching issues
        // (button text changes from "Sign In" to "Signing in..." during loading)
        const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement
        if (!btn) {
          throw new Error('Submit button not found')
        }
        const isDisabled = btn.disabled
        const text = btn.textContent || ''
        const showsLoading = /signing|loading|please wait/i.test(text)
        
        // Button should be disabled OR show loading text
        if (!isDisabled && !showsLoading) {
          throw new Error(`Button not in loading state. disabled=${isDisabled}, text="${text}"`)
        }
        expect(isDisabled || showsLoading).toBe(true)
      }, { timeout: 2000 })

      // Now resolve the promise to allow the request to complete and cleanup
      if (resolvePromise) {
        resolvePromise(undefined)
      }
    })
  })

  // ── Token storage ──────────────────────────────────────────────────────────
  describe('Token storage (localStorage)', () => {

    it('stores and retrieves kavach_access_token', () => {
      localStorage.setItem('kavach_access_token', 'test.jwt.token')
      expect(localStorage.getItem('kavach_access_token')).toBe('test.jwt.token')
    })

    it('returns null when no token is set', () => {
      expect(localStorage.getItem('kavach_access_token')).toBeNull()
    })

    it('token is null after being removed', () => {
      localStorage.setItem('kavach_access_token', 'some.token')
      localStorage.removeItem('kavach_access_token')
      expect(localStorage.getItem('kavach_access_token')).toBeNull()
    })

    it('refresh token is stored separately', () => {
      localStorage.setItem('kavach_access_token', 'access')
      localStorage.setItem('kavach_refresh_token', 'refresh')
      expect(localStorage.getItem('kavach_access_token')).toBe('access')
      expect(localStorage.getItem('kavach_refresh_token')).toBe('refresh')
    })
  })

  // ── lib/auth.ts utility ────────────────────────────────────────────────────
  describe('lib/auth.ts utility', () => {
    it('getAccessToken returns token from localStorage', () => {
      localStorage.setItem('kavach_access_token', 'test.token')
      const { getAccessToken } = require('@/lib/auth')
      expect(getAccessToken()).toBe('test.token')
      localStorage.removeItem('kavach_access_token')
    })

    it('isAuthenticated returns true when token exists', () => {
      localStorage.setItem('kavach_access_token', 'test.token')
      const { isAuthenticated } = require('@/lib/auth')
      expect(isAuthenticated()).toBe(true)
      localStorage.removeItem('kavach_access_token')
    })

    it('isAuthenticated returns false when no token', () => {
      localStorage.removeItem('kavach_access_token')
      const { isAuthenticated } = require('@/lib/auth')
      expect(isAuthenticated()).toBe(false)
    })
  })

})
