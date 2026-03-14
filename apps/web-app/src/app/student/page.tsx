'use client'
import { useState, useEffect, useCallback } from 'react'
import { Target, Clock, BookOpen,
         Play, Square, ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'
import { studentDashboardApi, type StudentDashboard, type ActiveFocusSession } from '@/lib/studentDashboard'
import { focusApi } from '@/lib/focus'
import { GoalsMini } from '@/components/GoalsMini'

// ── Category colors ───────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  EDUCATION:     '#3B82F6',
  GAMING:        '#EF4444',
  ENTERTAINMENT: '#F59E0B',
  SOCIAL_MEDIA:  '#8B5CF6',
  PRODUCTIVITY:  '#22C55E',
  COMMUNICATION: '#06B6D4',
  OTHER:         '#9CA3AF',
}

const CAT_LABELS: Record<string, string> = {
  EDUCATION: 'Education', GAMING: 'Gaming',
  ENTERTAINMENT: 'Entertainment', SOCIAL_MEDIA: 'Social',
  PRODUCTIVITY: 'Productivity', COMMUNICATION: 'Communication', OTHER: 'Other',
}

// ── Focus Score ring ──────────────────────────────────────────────────────────
function FocusScoreRing({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 70 ? 'Great! 🎉' : score >= 40 ? 'Good 👍' : 'Keep going 💪'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg width="112" height="112" className="-rotate-90">
          <circle cx="56" cy="56" r={r} fill="none" stroke="#F1F5F9" strokeWidth="10" />
          <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}</span>
          <span className="text-gray-400 text-xs">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-600 mt-2">{label}</span>
      <span className="text-gray-400 text-xs">Focus Score</span>
    </div>
  )
}

// ── Active focus timer banner ─────────────────────────────────────────────────
function ActiveFocusBanner({
  session, onStop
}: {
  session: ActiveFocusSession
  onStop: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(session.remainingSeconds)

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-3 md:p-4 text-white flex items-center gap-3">
      <div className="w-9 h-9 flex-shrink-0 bg-white/20 rounded-xl flex items-center justify-center">
        <Target size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{session.title}</div>
        <div className="text-blue-200 text-xs">Focus mode active</div>
      </div>
      <div className="text-xl md:text-2xl font-bold tabular-nums flex-shrink-0">
        {mins}:{secs.toString().padStart(2, '0')}
      </div>
      <button onClick={onStop}
        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex-shrink-0">
        <Square size={16} />
      </button>
    </div>
  )
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function WeeklyMiniChart({ data }: { data: StudentDashboard['weeklyData'] }) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} barSize={24} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="dayLabel" axisLine={false} tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 11 }} />
        <Bar dataKey="screenTimeSeconds" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.date === today ? '#3B82F6' : '#DBEAFE'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const d = await studentDashboardApi.get()
      setData(d)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000) // refresh every 60s
    return () => clearInterval(interval)
  }, [load])

  const handleStopFocus = async () => {
    if (!data?.activeFocusSession) return
    await focusApi.stop(data.activeFocusSession.sessionId)
    load()
  }

  const handleStartFocus = async () => {
    if (!data?.deviceId) return
    await focusApi.selfStart(data.deviceId, 25, 'Pomodoro')
    load()
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 animate-pulse">
        <div className="h-32 bg-white rounded-2xl shadow-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl shadow-sm" />)}
        </div>
        <div className="h-48 bg-white rounded-2xl shadow-sm" />
      </div>
    )
  }

  if (!data || !data.deviceLinked) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3">💻</div>
        <h2 className="text-gray-700 font-semibold">No device linked yet</h2>
        <p className="text-gray-400 text-sm mt-1">Ask your parent or institute to link a device to your account.</p>
      </div>
    )
  }

  const totalCatSecs = data.categories.reduce((s, c) => s + c.durationSeconds, 0)

  return (
    <div className="p-4 md:p-6 space-y-4 fade-up">

      {/* ── Active focus banner (shows only when focus is active) ── */}
      {data.activeFocusSession && (
        <ActiveFocusBanner session={data.activeFocusSession} onStop={handleStopFocus} />
      )}

      {/* ── Top row: score + stats + streak ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Focus Score */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center">
          <FocusScoreRing score={data.focusScore} />
        </div>

        {/* Today's stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-gray-400 text-xs font-medium mb-3">Today</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock size={13} className="text-blue-500" />
              </div>
              <div>
                <div className="text-gray-800 text-sm font-bold">
                  {data.stats.screenTimeFormatted}
                </div>
                <div className="text-gray-400 text-xs">Screen time</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                <Target size={13} className="text-purple-500" />
          </div>
              <div>
                <div className="text-gray-800 text-sm font-bold">
                  {data.stats.focusMinutesToday}m
          </div>
                <div className="text-gray-400 text-xs">Focus time</div>
        </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <BookOpen size={13} className="text-green-500" />
          </div>
              <div>
                <div className="text-gray-800 text-sm font-bold">
                  {data.stats.focusSessionsToday}
          </div>
                <div className="text-gray-400 text-xs">Sessions done</div>
        </div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <div className="text-4xl mb-1">🔥</div>
          <div className="text-4xl font-bold text-gray-900">{data.streak}</div>
          <div className="text-gray-500 text-sm font-medium">Day Streak</div>
          <div className="text-gray-400 text-xs mt-1">
            {data.streak === 0
              ? 'Start today!'
              : data.streak === 1
              ? 'Keep it up!'
              : `${data.streak} days in a row!`}
          </div>
          {!data.activeFocusSession && (
            <button onClick={handleStartFocus}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-medium"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
              <Play size={11} fill="white" /> Start Focus
            </button>
          )}
        </div>
      </div>

      {/* ── Middle row: weekly chart + category breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Weekly chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">This Week</h3>
              <p className="text-gray-400 text-xs">Daily screen time</p>
            </div>
            <TrendingUp size={16} className="text-gray-300" />
          </div>
          <WeeklyMiniChart data={data.weeklyData} />
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Today's Breakdown</h3>
          {data.categories.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-gray-300 text-sm">
              No activity yet today
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.categories.slice(0, 5).map(cat => {
                const pct = totalCatSecs > 0
                  ? Math.round((cat.durationSeconds / totalCatSecs) * 100) : 0
                const mins = Math.floor(cat.durationSeconds / 60)
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600 text-xs">{CAT_LABELS[cat.category] || cat.category}</span>
                      <span className="text-gray-500 text-xs">{mins}m · {pct}%</span>
                </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: CAT_COLORS[cat.category] || '#9CA3AF' }} />
                </div>
              </div>
                )
              })}
          </div>
          )}
        </div>
      </div>

      {/* ── Bottom: top apps + quick links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Top apps */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">Top Apps Today</h3>
          </div>
          {data.topApps.length === 0 ? (
            <div className="p-8 text-center text-gray-300 text-sm">No app data yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.topApps.map((app, i) => {
                const mins = Math.floor(app.durationSeconds / 60)
                return (
                  <div key={app.appName} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-gray-300 text-xs w-4">{i + 1}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CAT_COLORS[app.category] || '#9CA3AF' }} />
                    <span className="flex-1 text-gray-700 text-sm truncate">{app.appName}</span>
                    <span className="text-gray-400 text-xs">{mins}m</span>
                </div>
                )
              })}
          </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <Link href="/student/focus"
            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-4 text-white hover:opacity-95 transition-opacity">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Target size={20} />
            </div>
            <div>
              <div className="font-semibold text-sm">Start Focus Session</div>
              <div className="text-blue-200 text-xs">Pomodoro, study blocks & more</div>
            </div>
            <ChevronRight size={16} className="ml-auto opacity-70" />
          </Link>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-gray-500 text-xs font-medium mb-3">Your Progress</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">{data.streak}</div>
                <div className="text-amber-500 text-xs mt-0.5">Day Streak 🔥</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.focusScore}</div>
                <div className="text-blue-500 text-xs mt-0.5">Focus Score</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-gray-500 text-xs font-medium mb-2">Device</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-700 text-sm">{data.deviceName}</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">KAVACH agent active</p>
          </div>

          {data.deviceId && <GoalsMini deviceId={data.deviceId} />}
        </div>
      </div>
    </div>
  )
}
