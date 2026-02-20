'use client'
import { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Lock } from 'lucide-react'
import { badgesApi, BadgeProgress, Badge, BadgeTier, BadgeCategory } from '@/lib/badges'
import { useAuth } from '@/context/AuthContext'

// ── Tier config ────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<BadgeTier, { label: string; ring: string; bg: string }> = {
  BRONZE:   { label: 'Bronze',   ring: 'ring-amber-400',   bg: 'bg-amber-50' },
  SILVER:   { label: 'Silver',   ring: 'ring-gray-400',    bg: 'bg-gray-50' },
  GOLD:     { label: 'Gold',     ring: 'ring-yellow-400',  bg: 'bg-yellow-50' },
  PLATINUM: { label: 'Platinum', ring: 'ring-purple-400',  bg: 'bg-purple-50' },
}

const CATEGORY_LABELS: Record<BadgeCategory, { label: string; emoji: string }> = {
  FOCUS:     { label: 'Focus',     emoji: '🎯' },
  STREAK:    { label: 'Streaks',   emoji: '🔥' },
  USAGE:     { label: 'Usage',     emoji: '📚' },
  REDUCTION: { label: 'Reduction', emoji: '⬇️' },
  MILESTONE: { label: 'Milestone', emoji: '🏆' },
  SPECIAL:   { label: 'Special',   emoji: '⭐' },
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner:  '#9CA3AF',
  Explorer:  '#3B82F6',
  Achiever:  '#8B5CF6',
  Champion:  '#F59E0B',
  Legend:    '#EF4444',
}

// ── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge }: { badge: Badge }) {
  const tierCfg = TIER_CONFIG[badge.tier]

  return (
    <div className={`relative flex flex-col items-center p-4 rounded-2xl transition-all ${
      badge.earned
        ? `${tierCfg.bg} ring-2 ${tierCfg.ring}`
        : 'bg-gray-50 opacity-50 grayscale'
    }`}>
      {/* Badge icon */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2 ${
        badge.earned ? 'bg-white shadow-md' : 'bg-gray-100'
      }`}>
        {badge.earned ? badge.icon : <Lock size={20} className="text-gray-300" />}
      </div>

      {/* Tier label */}
      <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${
        badge.tier === 'GOLD' ? 'text-yellow-600' :
        badge.tier === 'SILVER' ? 'text-gray-500' :
        badge.tier === 'PLATINUM' ? 'text-purple-600' :
        'text-amber-700'
      }`}>{tierCfg.label}</span>

      <span className="text-gray-800 text-xs font-semibold text-center">{badge.name}</span>
      <span className="text-gray-400 text-xs text-center mt-0.5 line-clamp-2">{badge.description}</span>

      {badge.earned && (
        <div className="flex items-center gap-1 mt-2 bg-white px-2 py-0.5 rounded-full">
          <Zap size={10} className="text-yellow-500" />
          <span className="text-xs text-gray-600 font-medium">+{badge.xpReward} XP</span>
        </div>
      )}

      {!badge.earned && (
        <div className="flex items-center gap-1 mt-2">
          <Zap size={10} className="text-gray-300" />
          <span className="text-xs text-gray-300 font-medium">+{badge.xpReward} XP</span>
        </div>
      )}
    </div>
  )
}

// ── XP Progress bar ───────────────────────────────────────────────────────────
function XPBar({ level, xp, progress }: { level: string; xp: number; progress: number }) {
  const color = LEVEL_COLORS[level] || '#3B82F6'
  const nextLevels: Record<string, string> = {
    Beginner: 'Explorer', Explorer: 'Achiever',
    Achiever: 'Champion', Champion: 'Legend', Legend: 'Max'
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color }} />
          <div>
            <div className="font-bold text-gray-900" style={{ color }}>{level}</div>
            <div className="text-gray-400 text-xs">{xp} XP total</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 text-xs">Next: <span className="font-medium text-gray-700">{nextLevels[level]}</span></div>
          <div className="text-gray-400 text-xs">{progress}% there</div>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const { user } = useAuth()
  const deviceId = user?.deviceId || 'd1111111-1111-1111-1111-111111111111'
  const [data, setData] = useState<BadgeProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BadgeCategory | 'ALL'>('ALL')

  useEffect(() => {
    badgesApi.getProgress(deviceId)
      .then(setData)
      .catch(err => {
        console.error('Failed to load badges:', err)
      })
      .finally(() => setLoading(false))
  }, [deviceId])

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-24 bg-white rounded-2xl shadow-sm" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-2xl shadow-sm" />)}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-white rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const filtered = data.badges.filter(b =>
    filter === 'ALL' || b.category === filter
  )

  return (
    <div className="p-6 space-y-5 fade-up">
      <div>
        <h1 className="text-gray-900 font-bold text-xl flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          Achievements
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {data.badgesEarned} of {data.badgesTotal} badges earned
        </p>
      </div>

      {/* XP Bar */}
      <XPBar level={data.level} xp={data.totalXp} progress={data.levelProgress} />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(CATEGORY_LABELS) as [BadgeCategory, any][]).map(([cat, cfg]) => {
          const count = data.byCategory[cat] || 0
          return (
            <button key={cat} onClick={() => setFilter(filter === cat ? 'ALL' : cat)}
              className={`bg-white rounded-xl p-3 shadow-sm text-center transition-all ${
                filter === cat ? 'ring-2 ring-blue-500' : ''
              }`}>
              <div className="text-xl">{cfg.emoji}</div>
              <div className="text-gray-800 font-bold text-lg">{count}</div>
              <div className="text-gray-400 text-xs">{cfg.label}</div>
            </button>
          )
        })}
      </div>

      {/* Recently earned */}
      {data.recentlyEarned.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-4">
          <h3 className="text-amber-700 font-semibold text-sm mb-3 flex items-center gap-2">
            <Star size={15} className="text-yellow-500" /> Recently Earned
          </h3>
          <div className="flex gap-3">
            {data.recentlyEarned.map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <div className="font-semibold text-gray-800 text-xs">{b.name}</div>
                  <div className="text-yellow-600 text-xs">+{b.xpReward} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 text-sm">
            {filter === 'ALL' ? 'All Badges' : `${CATEGORY_LABELS[filter].label} Badges`}
            <span className="text-gray-400 font-normal ml-2">({filtered.length})</span>
          </h2>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')}
              className="text-blue-500 text-xs underline">Show all</button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {filtered.map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  )
}
