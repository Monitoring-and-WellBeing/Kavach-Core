/**
 * Integration tests for LoginScreen
 * Tests form validation, API call, loading state, and error display.
 */
import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import LoginScreen from '../../screens/LoginScreen'
import { AuthProvider } from '../../context/AuthContext'
import { api } from '../../lib/axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('../../lib/axios', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}))

const mockPost = api.post as jest.MockedFunction<typeof api.post>
const mockGet = api.get as jest.MockedFunction<typeof api.get>

// LoginScreen uses useAuth() so we wrap with AuthProvider
function renderScreen() {
  // Prevent /auth/me from firing (no stored token)
  mockGet.mockResolvedValue({ data: null } as any)
  return render(
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
})

describe('LoginScreen — render', () => {
  it('renders the KAVACH logo', async () => {
    const { getByText } = renderScreen()
    await waitFor(() => expect(getByText(/KAVACH/i)).toBeTruthy())
  })

  it('renders email and password inputs', async () => {
    const { getByPlaceholderText } = renderScreen()
    await waitFor(() => {
      expect(getByPlaceholderText('Email')).toBeTruthy()
      expect(getByPlaceholderText('Password')).toBeTruthy()
    })
  })

  it('renders the Sign In button', async () => {
    const { getByText } = renderScreen()
    await waitFor(() => expect(getByText('Sign In')).toBeTruthy())
  })

  it('renders the demo credentials hint', async () => {
    const { getByText } = renderScreen()
    await waitFor(() => expect(getByText(/student@demo\.com/)).toBeTruthy())
  })
})

describe('LoginScreen — validation', () => {
  it('shows an error when email is empty', async () => {
    const { getByText, getByPlaceholderText } = renderScreen()
    await waitFor(() => getByText('Sign In'))

    // Leave email blank, fill password
    fireEvent.changeText(getByPlaceholderText('Password'), 'pass123')
    fireEvent.press(getByText('Sign In'))

    await waitFor(() =>
      expect(getByText('Please enter your email and password')).toBeTruthy()
    )
  })

  it('shows an error when password is empty', async () => {
    const { getByText, getByPlaceholderText } = renderScreen()
    await waitFor(() => getByText('Sign In'))

    fireEvent.changeText(getByPlaceholderText('Email'), 'student@demo.com')
    fireEvent.press(getByText('Sign In'))

    await waitFor(() =>
      expect(getByText('Please enter your email and password')).toBeTruthy()
    )
  })
})

describe('LoginScreen — API integration', () => {
  it('calls /auth/login with trimmed lowercase email', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        accessToken: 'acc',
        refreshToken: 'ref',
        user: { id: '1', name: 'Student', email: 'student@demo.com', role: 'STUDENT', tenantId: 't1', phone: '' },
      },
    } as any)

    const { getByText, getByPlaceholderText } = renderScreen()
    await waitFor(() => getByText('Sign In'))

    fireEvent.changeText(getByPlaceholderText('Email'), '  STUDENT@DEMO.COM  ')
    fireEvent.changeText(getByPlaceholderText('Password'), 'demo123')

    await act(async () => {
      fireEvent.press(getByText('Sign In'))
    })

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'student@demo.com',
        password: 'demo123',
      })
    )
  })

  it('displays API error message on failed login', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Invalid email or password' } },
    })

    const { getByText, getByPlaceholderText } = renderScreen()
    await waitFor(() => getByText('Sign In'))

    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@test.com')
    fireEvent.changeText(getByPlaceholderText('Password'), 'badpass')

    await act(async () => {
      fireEvent.press(getByText('Sign In'))
    })

    await waitFor(() =>
      expect(getByText('Invalid email or password')).toBeTruthy()
    )
  })

  it('shows fallback error when API returns no message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network Error'))

    const { getByText, getByPlaceholderText } = renderScreen()
    await waitFor(() => getByText('Sign In'))

    fireEvent.changeText(getByPlaceholderText('Email'), 'x@x.com')
    fireEvent.changeText(getByPlaceholderText('Password'), 'abc')

    await act(async () => {
      fireEvent.press(getByText('Sign In'))
    })

    await waitFor(() =>
      expect(getByText('Invalid email or password')).toBeTruthy()
    )
  })
})
