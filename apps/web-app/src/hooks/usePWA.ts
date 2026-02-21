'use client'
import { useState, useEffect } from 'react'

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [swRegistered, setSwRegistered] = useState(false)

  useEffect(() => {
    // Check standalone mode
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)
    setIsOnline(navigator.onLine)

    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if SW is registered
    navigator.serviceWorker?.getRegistration()
      .then(reg => setSwRegistered(!!reg))

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isInstalled, isOnline, swRegistered }
}
