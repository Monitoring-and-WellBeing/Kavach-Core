'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, Heart } from 'lucide-react'
import { challengesParentApi, MoodTrend, MoodDay } from '@/lib/challenges'

const MOOD_EMOJI: Record<number, string> = {
  0: '—',
  1: '😢',
  2: '😟',
  3: '😐',
  4: '🙂',
  5: '😄',
}

const MOOD_BG: Record<number, string> = {
  0: 'bg-gray-100',
  1: 'bg-red-100',
  2: 'bg-orange-100',
  3: 'bg-yellow-50',
  4: 'bg-green-50',
  5: 'bg-emerald-100',
}

const MOOD_LABEL: Record<number, string> = {
  0: 'No check-in',
  1: 'Awful',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great!',
}

interface Props {
  deviceId: string
  childName: string
}

export function MoodTrendWidget({ deviceId, childName }: Props) {
  const [trend, setTrend] = useState<MoodTrend | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!deviceId) return
    setLoading(true)
    challengesParentApi
      .getMoodTrend(deviceId)
      .then(setTrend)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [deviceId])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-4" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!trend) return null

  const { last7Days, hasAlert, alertMessage, checkinStreak } = trend

  // Average mood (ignoring no-check-in days)
  const checkedDays = last7Days.filter((d) => d.mood > 0)
  const avgMood =
    checkedDays.length > 0
      ? (checkedDays.reduce((s, d) => s + d.mood, 0) / checkedDays.length).toFixed(1)
      : null

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-rose-400" />
          <h3 className="font-semibold text-gray-800 text-sm">
            {childName}&apos;s mood this week
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {checkinStreak > 0 && (
            <span className="text-xs text-gray-400">
              🔥 {checkinStreak}-day streak
            </span>
          )}
          {avgMood && (
            <span className="text-xs font-medium text-gray-600">
              Avg: {MOOD_EMOJI[Math.round(Number(avgMood))]} {avgMood}
            </span>
          )}
        </div>
      </div>

      {/* 7-day mood strip */}
      <div className="flex gap-1.5">
        {last7Days.map((day: MoodDay, i: number) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg ${
                MOOD_BG[day.mood]
              } ${day.mood === 0 ? 'opacity-40' : ''}`}
              title={day.mood > 0 ? MOOD_LABEL[day.mood] : 'No check-in'}
            >
              {MOOD_EMOJI[day.mood]}
            </div>
            <span className="text-[9px] text-gray-400 font-medium">
              {day.dayLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Trend line (simple bar chart) */}
      {checkedDays.length > 1 && (
        <div className="flex items-end gap-1.5 h-10">
          {last7Days.map((day: MoodDay, i: number) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div
                className={`rounded-sm transition-all ${
                  day.mood > 0 ? 'bg-blue-200' : 'bg-transparent'
                }`}
                style={{ height: day.mood > 0 ? `${(day.mood / 5) * 100}%` : '0%' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Mood concern alert */}
      {hasAlert && alertMessage && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-xs leading-snug">{alertMessage}</p>
        </div>
      )}

      {/* No data state */}
      {checkedDays.length === 0 && (
        <p className="text-gray-400 text-xs text-center py-2">
          {childName} hasn&apos;t checked in their mood yet this week.
        </p>
      )}
    </div>
  )
}
