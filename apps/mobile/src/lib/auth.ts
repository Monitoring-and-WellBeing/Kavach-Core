import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_KEY = 'kavach_access_token'
const REFRESH_KEY = 'kavach_refresh_token'
const DEVICE_ID_KEY = 'kavach_device_id'

export const AuthStorage = {
  getAccessToken: (): Promise<string | null> =>
    AsyncStorage.getItem(ACCESS_KEY),

  getRefreshToken: (): Promise<string | null> =>
    AsyncStorage.getItem(REFRESH_KEY),

  setTokens: async (access: string, refresh: string): Promise<void> => {
    await AsyncStorage.multiSet([
      [ACCESS_KEY, access],
      [REFRESH_KEY, refresh],
    ])
  },

  // ── Device ID — stored once during device pairing, never changes ────────────

  getDeviceId: (): Promise<string | null> =>
    AsyncStorage.getItem(DEVICE_ID_KEY),

  setDeviceId: (deviceId: string): Promise<void> =>
    AsyncStorage.setItem(DEVICE_ID_KEY, deviceId),

  clear: async (): Promise<void> => {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, DEVICE_ID_KEY])
  },
}
