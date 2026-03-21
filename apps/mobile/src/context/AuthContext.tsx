import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { api } from '../lib/axios'
import { AuthStorage } from '../lib/auth'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'INSTITUTE_ADMIN' | 'IT_HEAD' | 'PRINCIPAL' | 'PARENT' | 'STUDENT' | 'SUPER_ADMIN'
  tenantId: string
  phone: string
  deviceId?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from stored token on app launch
  useEffect(() => {
    AuthStorage.getAccessToken()
      .then(async (token) => {
        if (token) {
          try {
            const { data } = await api.get<AuthUser>('/auth/me')
            setUser(data)
          } catch {
            // Invalid / expired token — clear storage
            await AuthStorage.clear()
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{
      accessToken: string
      refreshToken: string
      user: AuthUser
    }>('/auth/login', { email, password })

    await AuthStorage.setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // best-effort
    }
    await AuthStorage.clear()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
