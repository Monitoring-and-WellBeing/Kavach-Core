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
  name: string
  email: string
  password: string
  phone?: string
  instituteName: string
  instituteType: string
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
        .then(res => setUser(res.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('kavach_access_token', data.accessToken)
    localStorage.setItem('kavach_refresh_token', data.refreshToken)
    setUser(data.user)
    router.push(ROLE_ROUTES[data.user.role] || '/')
  }, [router])

  const signup = useCallback(async (signupData: SignupData) => {
    const { data } = await api.post('/auth/signup', signupData)
    localStorage.setItem('kavach_access_token', data.accessToken)
    localStorage.setItem('kavach_refresh_token', data.refreshToken)
    setUser(data.user)
    router.push('/institute')
  }, [router])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('kavach_access_token')
    localStorage.removeItem('kavach_refresh_token')
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
