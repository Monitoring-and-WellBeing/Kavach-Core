'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { api } from '@/lib/axios'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  name: string
  email: string
  role: 'INSTITUTE_ADMIN' | 'IT_HEAD' | 'PRINCIPAL' | 'PARENT' | 'STUDENT' | 'SUPER_ADMIN'
  tenantId: string
  phone: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

interface SignupData {
  role: 'INSTITUTE_ADMIN' | 'PARENT'
  name: string
  email: string
  password: string
  phone?: string
  instituteName?: string
  instituteType?: string
  city?: string
  state?: string
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

const ROLE_ROUTES: Record<string, string> = {
  INSTITUTE_ADMIN: '/institute',
  IT_HEAD: '/institute',
  PRINCIPAL: '/institute',
  PARENT: '/parent',
  STUDENT: '/student',
  SUPER_ADMIN: '/institute',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('kavach_access_token')
    if (token) {
      api.get('/auth/me')
        .then(res => {
          localStorage.setItem('kavach_user_profile', JSON.stringify(res.data))
          setUser(res.data)
        })
        .catch(() => {
          localStorage.removeItem('kavach_access_token')
          localStorage.removeItem('kavach_refresh_token')
          localStorage.removeItem('kavach_user_profile')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('kavach_access_token', data.accessToken)
    localStorage.setItem('kavach_refresh_token', data.refreshToken)
    localStorage.setItem('kavach_user_profile', JSON.stringify(data.user))
    setUser(data.user)
    router.push(ROLE_ROUTES[data.user.role] || '/')
  }, [router])

  const signup = useCallback(async (signupData: SignupData) => {
    const { data } = await api.post('/auth/signup', signupData)
    localStorage.setItem('kavach_access_token', data.accessToken)
    localStorage.setItem('kavach_refresh_token', data.refreshToken)
    localStorage.setItem('kavach_user_profile', JSON.stringify(data.user))
    setUser(data.user)
    router.push(ROLE_ROUTES[data.user.role] || '/')
  }, [router])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('kavach_access_token')
    localStorage.removeItem('kavach_refresh_token')
    localStorage.removeItem('kavach_user_profile')
    localStorage.removeItem('kavach_token') // legacy key — clear for safety
    setUser(null)
    router.push('/')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
