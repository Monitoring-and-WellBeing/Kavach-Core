'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/')
    } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.push('/')
    } else {
      setChecking(false)
    }
  }, [user, loading, allowedRoles, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
