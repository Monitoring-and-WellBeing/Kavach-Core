'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/')
      return
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.push('/')
    }
  }, [user, loading, allowedRoles, router])

  return <>{children}</>
}
