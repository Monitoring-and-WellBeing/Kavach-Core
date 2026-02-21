'use client'
import { useState, useEffect, useRef } from 'react'
import { Target, Square, Clock, ChevronDown } from 'lucide-react'
import { focusApi, FocusSession } from '@/lib/focus'

const PRESETS = [
  { label: '25 min', value: 25, emoji: '🍅', desc: 'Pomodoro' },
  { label: '45 min', value: 45, emoji: '📚', desc: 'Study block' },
  { label: '60 min', value: 60, emoji: '🎯', desc: 'Deep focus' },
  { label: '90 min', value: 90, emoji: '🔥', desc: 'Long session' },
]

interface Props {
  deviceId: string
  deviceName: string
  onSessionChange?: () => void
}

export function FocusControl({ deviceId, deviceName, onSessionChange }: Props) {
  const [active, setActive] = useState<FocusSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(25)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    focusApi.getActive(deviceId).then(s => {
      setActive(s)
      if (s) setTimeLeft(s.remainingSeconds)
    })
  }, [deviceId])

  // Countdown timer
  useEffect(() => {
    if (active && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current)
            setActive(null)
            onSessionChange?.()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [active])

  const handleStart = async () => {
    setLoading(true)
    try {
      const session = await focusApi.start(deviceId, selectedDuration,
        `${selectedDuration}-minute Focus`)
      setActive(session)
      setTimeLeft(session.remainingSeconds)
      setOpen(false)
      onSessionChange?.()
    } finally { setLoading(false) }
  }

  const handleStop = async () => {
    if (!active) return
    setLoading(true)
    try {
      await focusApi.stop(active.id)
      setActive(null)
      setTimeLeft(0)
      onSessionChange?.()
    } finally { setLoading(false) }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (active) {
    const progress = active.progressPercent + ((active.durationMinutes * 60 - timeLeft) /
      (active.durationMinutes * 60) * (100 - active.progressPercent))

    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="text-blue-700 text-xs font-semibold">{active.title}</div>
          <div className="text-blue-500 text-xs">{formatTime(timeLeft)} remaining</div>
          <div className="w-full bg-blue-100 rounded-full h-1 mt-1">
            <div className="bg-blue-500 h-1 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
        <button onClick={handleStop} disabled={loading}
          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition-colors flex-shrink-0">
          <Square size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 text-xs font-medium transition-colors">
        <Target size={13} />
        Focus
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[14rem] w-56 bg-white rounded-2xl shadow-lg border border-gray-100 p-3 z-20">
          <p className="text-gray-500 text-xs mb-2">Start focus on <span className="font-medium text-gray-700">{deviceName}</span></p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {PRESETS.map(p => (
              <button key={p.value} onClick={() => setSelectedDuration(p.value)}
                className={`p-2.5 rounded-xl text-left transition-all border-2 min-h-[56px] ${
                  selectedDuration === p.value ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'
                }`}>
                <div className="text-base">{p.emoji}</div>
                <div className="text-gray-800 text-xs font-semibold mt-0.5">{p.label}</div>
                <div className="text-gray-400 text-xs">{p.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={handleStart} disabled={loading}
            className="w-full py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            {loading ? 'Starting...' : `Start ${selectedDuration}-min Focus`}
          </button>
        </div>
      )}
    </div>
  )
}
