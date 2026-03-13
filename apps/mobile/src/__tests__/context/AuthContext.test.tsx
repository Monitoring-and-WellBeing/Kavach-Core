/**
 * Integration tests for AuthContext
 * Tests login, logout, and session restore on app launch.
 */
import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { render, act, waitFor, fireEvent } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import { api } from '../../lib/axios'

jest.mock('../../lib/axios', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}))

const mockGet = api.get as jest.MockedFunction<typeof api.get>
const mockPost = api.post as jest.MockedFunction<typeof api.post>

// ── Helper component ────────────────────────────────────────────────────────
function TestConsumer() {
  const { user, loading, isAuthenticated, login, logout } = useAuth()

  if (loading) return <Text testID="loading">Loading...</Text>

  return (
    <>
      <Text testID="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</Text>
      <Text testID="user-email">{user?.email ?? 'none'}</Text>
      <TouchableOpacity
        testID="login-btn"
        onPress={async () => {
          try { await login('test@example.com', 'pass123') } catch (_) { /* errors intentionally tested */ }
        }}
      >
        <Text>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout-btn" onPress={() => logout()}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </>
  )
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
})

describe('AuthContext — initial state', () => {
  it('shows unauthenticated when no stored token', async () => {
    const { getByTestId } = renderWithAuth()
    await waitFor(() => expect(getByTestId('auth-status').props.children).toBe('unauthenticated'))
  })

  it('restores session when access token + valid /auth/me exist', async () => {
    await AsyncStorage.setItem('kavach_access_token', 'stored-jwt')
    mockGet.mockResolvedValueOnce({
      data: {
        id: 'u1', name: 'Ravi Kumar', email: 'ravi@school.com',
        role: 'STUDENT', tenantId: 't1', phone: '9876543210',
      },
    } as any)

    const { getByTestId } = renderWithAuth()
    await waitFor(() => expect(getByTestId('auth-status').props.children).toBe('authenticated'))
    expect(getByTestId('user-email').props.children).toBe('ravi@school.com')
  })

  it('stays unauthenticated if /auth/me fails (token expired)', async () => {
    await AsyncStorage.setItem('kavach_access_token', 'expired-token')
    mockGet.mockRejectedValueOnce(new Error('401 Unauthorized'))

    const { getByTestId } = renderWithAuth()
    await waitFor(() => expect(getByTestId('auth-status').props.children).toBe('unauthenticated'))

    // Token should be cleared from storage
    expect(await AsyncStorage.getItem('kavach_access_token')).toBeNull()
  })
})

describe('AuthContext — login()', () => {
  it('stores tokens and sets user on successful login', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: {
          id: 'u2', name: 'Priya', email: 'priya@school.com',
          role: 'STUDENT', tenantId: 't1', phone: '1234567890',
        },
      },
    } as any)

    const { getByTestId } = renderWithAuth()
    await waitFor(() => expect(getByTestId('auth-status')).toBeTruthy())

    await act(async () => {
      fireEvent.press(getByTestId('login-btn'))
    })

    await waitFor(() =>
      expect(getByTestId('auth-status').props.children).toBe('authenticated')
    )
    expect(getByTestId('user-email').props.children).toBe('priya@school.com')

    expect(await AsyncStorage.getItem('kavach_access_token')).toBe('new-access')
    expect(await AsyncStorage.getItem('kavach_refresh_token')).toBe('new-refresh')
  })

  it('throws on bad credentials (API 401)', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } })

    const { getByTestId } = renderWithAuth()
    await waitFor(() => expect(getByTestId('auth-status')).toBeTruthy())

    // The login call itself should reject — consumer must handle the error
    await act(async () => {
      fireEvent.press(getByTestId('login-btn'))
    })

    // Still unauthenticated after failed login
    await waitFor(() =>
      expect(getByTestId('auth-status').props.children).toBe('unauthenticated')
    )
  })
})

describe('AuthContext — logout()', () => {
  it('clears user and tokens on logout', async () => {
    // Seed logged-in state
    await AsyncStorage.setItem('kavach_access_token', 'live-token')
    mockGet.mockResolvedValueOnce({
      data: {
        id: 'u3', name: 'Dev', email: 'dev@school.com',
        role: 'STUDENT', tenantId: 't1', phone: '111',
      },
    } as any)
    mockPost.mockResolvedValueOnce({} as any) // /auth/logout

    const { getByTestId } = renderWithAuth()
    await waitFor(() =>
      expect(getByTestId('auth-status').props.children).toBe('authenticated')
    )

    await act(async () => {
      fireEvent.press(getByTestId('logout-btn'))
    })

    await waitFor(() =>
      expect(getByTestId('auth-status').props.children).toBe('unauthenticated')
    )
    expect(await AsyncStorage.getItem('kavach_access_token')).toBeNull()
  })
})
