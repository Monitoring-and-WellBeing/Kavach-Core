'use client'
import { useEffect, useState } from 'react'
import { Zap, CheckCircle2 } from 'lucide-react'
import { challengesParentApi, ChildChallenge } from '@/lib/challenges'

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY:   'text-emerald-600',
  MEDIUM: 'text-amber-600',
  HARD:   'text-red-500',
}

const DIFFICULTY_BG: Record<string, string> = {
  EASY:   'bg-emerald-50',
  MEDIUM: 'bg-amber-50',
  HARD:   'bg-red-50',
}

interface Props {
  deviceId: string
  childName: string
}

export function ChildChallengesWidget({ deviceId, childName }: Props) {
  const [challenges, setChallenges] = useState<ChildChallenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!deviceId) return
    setLoading(true)
    challengesParentApi
      .getChallenges(deviceId)
      .then(setChallenges)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [deviceId])

  const completedCount = challenges.filter((c) => c.completed).length
  const totalXpAvailable = challenges.reduce((s, c) => s + c.xpReward, 0)
  const xpEarned = challenges
    .filter((c) => c.completed)
    .reduce((s, c) => s + c.xpReward, 0)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-50 rounded-xl mb-2" />
        ))}
      </div>
    )
  }

  if (challenges.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-500" />
          <h3 className="font-semibold text-gray-800 text-sm">
            ⚡ {childName}&apos;s challenges today
          </h3>
        </div>
        <p className="text-gray-400 text-xs text-center py-4">
          No challenges assigned yet
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-500" />
          <h3 className="font-semibold text-gray-800 text-sm">
            {childName}&apos;s challenges today
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {completedCount}/{challenges.length} done
          </span>
          <span className="text-xs font-bold text-blue-600">
            +{xpEarned}/{totalXpAvailable} XP
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{
            width: `${challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Challenge list */}
      <div className="space-y-2">
        {challenges.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              c.completed ? 'bg-emerald-50' : 'bg-gray-50'
            }`}
          >
            {/* Icon */}
            <span className="text-xl w-7 text-center flex-shrink-0">
              {c.completed ? '✅' : c.icon}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-semibold truncate ${
                  c.completed ? 'text-emerald-700 line-through' : 'text-gray-700'
                }`}
              >
                {c.title}
              </p>

              {/* Inline progress for incremental challenges */}
              {!c.completed && c.targetValue > 1 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{
                        width: `${Math.min(100, (c.currentValue / c.targetValue) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs">
                    {c.currentValue}/{c.targetValue}
                  </span>
                </div>
              )}
            </div>

            {/* Difficulty + XP */}
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span
                className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                  DIFFICULTY_BG[c.difficulty]
                } ${DIFFICULTY_COLOR[c.difficulty]}`}
              >
                {c.difficulty}
              </span>
              <span className="text-xs font-bold text-blue-600">
                +{c.xpReward} XP
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* All done banner */}
      {completedCount === challenges.length && challenges.length > 0 && (
        <div className="mt-3 flex items-center gap-2 bg-emerald-50 rounded-xl p-3">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <p className="text-emerald-700 text-xs font-semibold">
            All challenges completed! 🎉 +{totalXpAvailable} XP earned
          </p>
        </div>
      )}
    </div>
  )
}
