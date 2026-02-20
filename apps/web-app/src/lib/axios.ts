import axios, { AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Attach JWT to every request ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('kavach_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('kavach_refresh_token')

        if (refreshToken) {
          try {
            const { data } = await axios.post(
              `${API_URL}/api/v1/auth/refresh`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            )
            localStorage.setItem('kavach_access_token', data.accessToken)
            localStorage.setItem('kavach_refresh_token', data.refreshToken)
            original.headers.Authorization = `Bearer ${data.accessToken}`
            return api(original)
          } catch {
            localStorage.removeItem('kavach_access_token')
            localStorage.removeItem('kavach_refresh_token')
            window.location.href = '/'
          }
        }
      }
    }

    return Promise.reject(err)
  }
)
