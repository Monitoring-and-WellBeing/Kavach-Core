'use client'
import { MoodTrendItem } from '@/lib/insights'

// ── Mood config ────────────────────────────────────────────────────────────────
const MOOD_CONFIG: Record<number, { label: string; emoji: string; color: string; bg: string }> = {
  5: { label: 'Great',    emoji: '😄', color: '#22C55E', bg: '#F0FDF4' },
  4: { label: 'Good',     emoji: '🙂', color: '#84CC16', bg: '#F7FEE7' },
  3: { label: 'Okay',     emoji: '😐', color: '#F59E0B', bg: '#FFFBEB' },
  2: { label: 'Tired',    emoji: '😔', color: '#F97316', bg: '#FFF7ED' },
  1: { label: 'Stressed', emoji: '😟', color: '#EF4444', bg: '#FEF2F2' },
}

interface Props {
  data: MoodTrendItem[]
  studentName?: string
}

export default function MoodTrendChart({ data, studentName }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-4xl mb-2">😊</span>
        <p className="text-gray-400 text-sm">No mood check-ins yet</p>
        <p className="text-gray-300 text-xs mt-1">
          Mood data appears once {studentName || 'the student'} starts daily check-ins
        </p>
      </div>
    )
  }

  // Build a 7-day grid (fill gaps with null)
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const moodByDay: (MoodTrendItem | null)[] = days.map((day) => {
    const dayStr = day.toISOString().slice(0, 10)
    return (
      data.find((d) => new Date(d.checkedInAt).toISOString().slice(0, 10) === dayStr) ?? null
    )
  })

  // Average mood
  const validMoods = moodByDay.filter(Boolean) as MoodTrendItem[]
  const avg = validMoods.length > 0
    ? validMoods.reduce((s, m) => s + m.mood, 0) / validMoods.length
    : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400">
            Mood data from {studentName || 'student'}'s daily check-ins
          </p>
        </div>
        {avg !== null && (
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-1.5">
            <span className="text-lg">{MOOD_CONFIG[Math.round(avg)]?.emoji}</span>
            <span className="text-xs text-gray-600 font-medium">
              Avg: {MOOD_CONFIG[Math.round(avg)]?.label}
            </span>
          </div>
        )}
      </div>

      {/* Chart — 7 day bubbles + connecting line */}
      <div className="relative">
        {/* SVG connecting line */}
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          style={{ height: 80, top: 12 }}
          preserveAspectRatio="none"
        >
          {moodByDay.map((item, i) => {
            if (!item || i === 0) return null
            const prev = moodByDay.slice(0, i).reverse().find(Boolean)
            if (!prev) return null
            const prevIdx = moodByDay.lastIndexOf(prev, i - 1)
            if (prevIdx < 0) return null

            const x1 = ((prevIdx + 0.5) / 7) * 100
            const y1 = ((5 - prev.mood) / 4) * 100
            const x2 = ((i + 0.5) / 7) * 100
            const y2 = ((5 - item.mood) / 4) * 100

            return (
              <line
                key={i}
                x1={`${x1}%`} y1={`${y1}%`}
                x2={`${x2}%`} y2={`${y2}%`}
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            )
          })}
        </svg>

        {/* Day columns */}
        <div className="grid grid-cols-7 gap-1 relative z-10" style={{ height: 104 }}>
          {moodByDay.map((item, i) => {
            const day = days[i]
            const isToday = i === 6
            const cfg = item ? MOOD_CONFIG[item.mood] : null

            return (
              <div key={i} className="flex flex-col items-center justify-end gap-1">
                {/* Mood bubble */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all"
                  style={{
                    backgroundColor: cfg ? cfg.bg : '#F8FAFC',
                    border: `2px solid ${cfg ? cfg.color : '#E2E8F0'}`,
                    opacity: cfg ? 1 : 0.4,
                  }}
                  title={cfg ? `${cfg.label} (${item!.moodLabel || cfg.label})` : 'No check-in'}
                >
                  <span>{cfg ? cfg.emoji : '·'}</span>
                </div>

                {/* Day label */}
                <span
                  className={`text-xs font-medium ${
                    isToday ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {dayLabels[day.getDay()]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-gray-50">
        {Object.entries(MOOD_CONFIG).reverse().map(([val, cfg]) => (
          <div key={val} className="flex items-center gap-1">
            <span className="text-sm">{cfg.emoji}</span>
            <span className="text-xs text-gray-400">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
