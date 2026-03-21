'use client'

import { useAuth } from '@/context/AuthContext'

export function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    // GAP-19 FIXED
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600" />
          <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
