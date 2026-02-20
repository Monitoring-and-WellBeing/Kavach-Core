'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  INSTITUTE_ADMIN: ['/institute'],
  IT_HEAD: ['/institute'],
  PRINCIPAL: ['/institute'],
  PARENT: ['/parent'],
  STUDENT: ['/student'],
  SUPER_ADMIN: ['/institute', '/parent', '/student'],
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user && pathname !== '/' && !pathname.startsWith('/auth')) {
      router.replace('/')
      return
    }
    if (user) {
      const allowed = ROLE_ALLOWED_PATHS[user.role] || []
      const canAccess = allowed.some(p => pathname.startsWith(p))
      if (!canAccess && pathname !== '/') {
        router.replace(allowed[0] || '/')
      }
    }
  }, [user, loading, pathname, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  return <>{children}</>
}
