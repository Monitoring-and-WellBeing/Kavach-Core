'use client'
import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOffline = () => {
      setIsOffline(true)
      setJustReconnected(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setJustReconnected(true)
      // Hide "back online" message after 3 seconds
      setTimeout(() => setJustReconnected(false), 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !justReconnected) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isOffline ? 'bg-gray-900' : 'bg-green-600'
    }`}>
      <div className="flex items-center justify-center gap-2 py-2 px-4">
        {isOffline ? (
          <>
            <WifiOff size={14} className="text-gray-400" />
            <span className="text-gray-300 text-xs font-medium">
              You're offline — showing cached data
            </span>
          </>
        ) : (
          <>
            <Wifi size={14} className="text-white" />
            <span className="text-white text-xs font-medium">
              Back online — data is refreshing
            </span>
          </>
        )}
      </div>
    </div>
  )
}
