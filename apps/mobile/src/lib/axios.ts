import axios from 'axios'
import { AuthStorage } from './auth'

// NOTE: In development use your machine's IP — NOT localhost
//   Android emulator  → 10.0.2.2
//   Physical device   → your machine's LAN IP (e.g. 192.168.1.x)
// Set EXPO_PUBLIC_API_URL in .env to override.
const BASE_URL: string =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://10.0.2.2:8080/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Attach JWT to every request ───────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AuthStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Auto-refresh on 401 ────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = await AuthStorage.getRefreshToken()

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          await AuthStorage.setTokens(data.accessToken, data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          await AuthStorage.clear()
        }
      } else {
        await AuthStorage.clear()
      }
    }

    return Promise.reject(error)
  }
)

export { api }
