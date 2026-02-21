'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Target, Play, Square, CheckCircle, Clock } from 'lucide-react'
import { focusApi, FocusSession } from '@/lib/focus'
import { useAuth } from '@/context/AuthContext'

const PRESETS = [
  { label: '25 min', value: 25, emoji: '🍅', desc: 'Pomodoro' },
  { label: '45 min', value: 45, emoji: '📚', desc: 'Study block' },
  { label: '60 min', value: 60, emoji: '🎯', desc: 'Deep work' },
  { label: '90 min', value: 90, emoji: '🔥', desc: 'Marathon' },
]

type Phase = 'idle' | 'active' | 'done'

export default function StudentFocusPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [selected, setSelected] = useState(25)
  const [session, setSession] = useState<FocusSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [history, setHistory] = useState<FocusSession[]>([])
  const [stats, setStats] = useState({ focusMinutesToday: 0, sessionsToday: 0 })
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  // Needs device ID from user's linked device
  // For student, we use their primary device (first device in their tenant)
  // TODO: Get deviceId from student dashboard data or device list
  const deviceId = 'd1111111-1111-1111-1111-111111111111'

  const loadData = useCallback(async () => {
    const [active, hist, todayStats] = await Promise.all([
      focusApi.getActive(deviceId),
      focusApi.getHistory(deviceId),
      focusApi.getTodayStats(deviceId),
    ])
    if (active) { setSession(active); setTimeLeft(active.remainingSeconds); setPhase('active') }
    setHistory(hist)
    setStats(todayStats)
  }, [deviceId])

  useEffect(() => { loadData() }, [loadData])

  // Countdown
  useEffect(() => {
    if (phase === 'active' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setPhase('done'); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const handleStart = async () => {
    setLoading(true)
    try {
      const s = await focusApi.selfStart(deviceId, selected, PRESETS.find(p => p.value === selected)?.desc)
      setSession(s); setTimeLeft(s.remainingSeconds); setPhase('active')
    } finally { setLoading(false) }
  }

  const handleStop = async () => {
    if (!session) return
    setLoading(true)
    try {
      await focusApi.stop(session.id)
      setSession(null); setTimeLeft(0); setPhase('idle')
      loadData()
    } finally { setLoading(false) }
  }

  const handleDone = () => { setPhase('idle'); loadData() }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const progress = session
    ? ((session.durationMinutes * 60 - timeLeft) / (session.durationMinutes * 60)) * 100
    : 0

  const circumference = 2 * Math.PI * 54

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto fade-up">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Focus Mode</h1>
        <p className="text-gray-400 text-sm mt-1">
          {stats.sessionsToday} sessions · {stats.focusMinutesToday} min today
        </p>
      </div>

      {/* ── Idle: preset selector ── */}
      {phase === 'idle' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESETS.map(p => (
              <button key={p.value} onClick={() => setSelected(p.value)}
                className={`p-3 md:p-4 rounded-2xl border-2 text-center transition-all ${
                  selected === p.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}>
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="font-semibold text-gray-800 text-sm">{p.label}</div>
                <div className="text-gray-400 text-xs">{p.desc}</div>
              </button>
            ))}
          </div>

          <button onClick={handleStart} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Play size={22} fill="white" />
            {loading ? 'Starting...' : `Start ${selected}-min Focus`}
          </button>
        </div>
      )}

      {/* ── Active: circular timer ── */}
      {phase === 'active' && (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r="54" fill="none" stroke="#F1F5F9" strokeWidth="10" />
              <circle cx="70" cy="70" r="54" fill="none" stroke="#3B82F6" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {mins}:{secs.toString().padStart(2, '0')}
              </div>
              <div className="text-gray-400 text-xs mt-0.5">remaining</div>
            </div>
          </div>

          <div className="text-center">
            <div className="font-semibold text-gray-800">{session?.title}</div>
            <div className="text-gray-400 text-sm">{session?.durationMinutes} minute session</div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 text-center">
            <p className="text-blue-700 text-sm font-medium">🎯 Stay focused!</p>
            <p className="text-blue-500 text-xs mt-0.5">Only study apps are allowed right now</p>
          </div>

          <button onClick={handleStop} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-600 font-medium transition-colors">
            <Square size={16} /> End Session Early
          </button>
        </div>
      )}

      {/* ── Done: celebration ── */}
      {phase === 'done' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Session Complete! 🎉</h2>
          <p className="text-gray-500 text-center">
            You focused for {session?.durationMinutes} minutes. Great work!
          </p>
          <button onClick={handleDone} className="px-8 py-3 rounded-2xl text-white font-medium"
            style={{ background: '#2563EB' }}>
            Start Another
          </button>
        </div>
      )}

      {/* ── Session History ── */}
      {history.length > 0 && phase !== 'active' && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Clock size={14} /> Recent Sessions
          </h3>
          <div className="space-y-2">
            {history.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  s.status === 'COMPLETED' ? 'bg-green-500' :
                  s.status === 'CANCELLED' ? 'bg-red-400' : 'bg-gray-300'
                }`} />
                <div className="flex-1">
                  <div className="text-gray-700 text-sm font-medium">{s.title}</div>
                  <div className="text-gray-400 text-xs">
                    {new Date(s.startedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    {' · '}{s.durationMinutes} min
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  s.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
