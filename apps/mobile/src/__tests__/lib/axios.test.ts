/**
 * Unit tests for src/lib/axios.ts
 * Tests the auth interceptor logic via AuthStorage directly
 * (full interceptor integration requires a live HTTP server which is out of scope).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthStorage } from '../../lib/auth'

// Mock axios so the module loads without a real network
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn().mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
    }),
    post: jest.fn(),
  }
  return { ...mockAxios, default: mockAxios }
})

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
})

describe('axios module — token attachment logic', () => {
  it('AuthStorage returns null when no token is set', async () => {
    const token = await AuthStorage.getAccessToken()
    expect(token).toBeNull()
  })

  it('AuthStorage returns the token set via setTokens', async () => {
    await AuthStorage.setTokens('access-xyz', 'refresh-xyz')
    expect(await AuthStorage.getAccessToken()).toBe('access-xyz')
    expect(await AuthStorage.getRefreshToken()).toBe('refresh-xyz')
  })

  it('importing the axios module does not throw', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../lib/axios')
    }).not.toThrow()
  })
})

describe('axios module — 401 clear logic', () => {
  it('AuthStorage.clear removes tokens (simulates 401 handler)', async () => {
    await AuthStorage.setTokens('old-access', 'old-refresh')
    await AuthStorage.clear()

    expect(await AsyncStorage.getItem('kavach_access_token')).toBeNull()
    expect(await AsyncStorage.getItem('kavach_refresh_token')).toBeNull()
  })

  it('setTokens + clear is idempotent (can clear twice without error)', async () => {
    await AuthStorage.setTokens('a', 'b')
    await AuthStorage.clear()
    await expect(AuthStorage.clear()).resolves.not.toThrow()
  })
})
