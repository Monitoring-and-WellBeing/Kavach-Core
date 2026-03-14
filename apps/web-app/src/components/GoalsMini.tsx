'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Target } from 'lucide-react'
import { goalsApi, Goal } from '@/lib/goals'

export function GoalsMini({ deviceId }: { deviceId: string }) {
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    goalsApi.getForDevice(deviceId).then(setGoals).catch(() => {})
  }, [deviceId])

  if (goals.length === 0) return null
  const met = goals.filter(g => g.metToday).length

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          <Target size={14} className="text-blue-500" /> Today's Goals
        </h3>
        <span className="text-xs text-gray-400">{met}/{goals.length} done</span>
      </div>
      <div className="space-y-2">
        {goals.slice(0, 4).map(goal => (
          <div key={goal.id} className="flex items-center gap-2">
            {goal.metToday
              ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              : <Circle size={16} className="text-gray-300 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-xs font-medium truncate">{goal.title}</span>
                <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{goal.progressLabel}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                <div className="h-1 rounded-full transition-all"
                  style={{ width: `${Math.min(goal.progressPercent, 100)}%`, background: goal.metToday ? '#22C55E' : '#3B82F6' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
