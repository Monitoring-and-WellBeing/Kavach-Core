/**
 * Unit tests for src/lib/auth.ts
 * Verifies AsyncStorage-backed token storage: set, get, clear.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthStorage } from '../../lib/auth'

const ACCESS_KEY = 'kavach_access_token'
const REFRESH_KEY = 'kavach_refresh_token'

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
})

describe('AuthStorage.setTokens', () => {
  it('stores both access and refresh tokens', async () => {
    await AuthStorage.setTokens('access-abc', 'refresh-xyz')

    expect(await AsyncStorage.getItem(ACCESS_KEY)).toBe('access-abc')
    expect(await AsyncStorage.getItem(REFRESH_KEY)).toBe('refresh-xyz')
  })
})

describe('AuthStorage.getAccessToken', () => {
  it('returns null when no token stored', async () => {
    expect(await AuthStorage.getAccessToken()).toBeNull()
  })

  it('returns the stored access token', async () => {
    await AsyncStorage.setItem(ACCESS_KEY, 'token-123')
    expect(await AuthStorage.getAccessToken()).toBe('token-123')
  })
})

describe('AuthStorage.getRefreshToken', () => {
  it('returns null when no token stored', async () => {
    expect(await AuthStorage.getRefreshToken()).toBeNull()
  })

  it('returns the stored refresh token', async () => {
    await AsyncStorage.setItem(REFRESH_KEY, 'refresh-456')
    expect(await AuthStorage.getRefreshToken()).toBe('refresh-456')
  })
})

describe('AuthStorage.clear', () => {
  it('removes both tokens', async () => {
    await AuthStorage.setTokens('a', 'b')
    await AuthStorage.clear()

    expect(await AsyncStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(await AsyncStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('is safe to call when no tokens are stored', async () => {
    await expect(AuthStorage.clear()).resolves.not.toThrow()
  })
})
