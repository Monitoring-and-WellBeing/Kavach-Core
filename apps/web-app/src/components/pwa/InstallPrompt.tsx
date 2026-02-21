'use client'
import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed)
      // Don't show again for 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
    }

    // iOS detection
    const ua = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
    if (isIOSDevice && isSafari) {
      setIsIOS(true)
      // Show iOS instructions after 3 seconds
      setTimeout(() => setVisible(true), 3000)
      return
    }

    // Android / Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show after 5 seconds on parent dashboard
      setTimeout(() => setVisible(true), 5000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setDeferredPrompt(null)
    setVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setVisible(false)
  }

  if (!visible || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-700 flex items-start gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <span className="text-white font-black text-lg">K</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm">Install KAVACH AI</div>
          {isIOS ? (
            <p className="text-gray-400 text-xs mt-0.5">
              Tap <span className="text-blue-400">Share</span> then{' '}
              <span className="text-blue-400">"Add to Home Screen"</span> to install
            </p>
          ) : (
            <p className="text-gray-400 text-xs mt-0.5">
              Add to your home screen for faster access
            </p>
          )}

          {!isIOS && (
            <button onClick={handleInstall}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Download size={12} /> Install App
            </button>
          )}

          {isIOS && (
            <div className="mt-2 flex items-center gap-1.5 text-gray-400 text-xs">
              <Smartphone size={12} />
              <span>Works like a native app once installed</span>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button onClick={handleDismiss}
          className="p-1 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
