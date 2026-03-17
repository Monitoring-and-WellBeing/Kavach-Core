'use client'
import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, Toast } from '@/components/ui/Toast'
import { goalsApi, Goal, GoalType, GOAL_TYPE_CONFIG } from '@/lib/goals'
import { studentDashboardApi } from '@/lib/studentDashboard'

export default function Goals() {
  const [goals, setGoals]   = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]     = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [form, setForm]     = useState({
    title: '',
    goalType: 'FOCUS_MINUTES' as GoalType,
    period: 'DAILY',
    targetValue: 45,
  })
  const [saving, setSaving] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    studentDashboardApi.get()
      .then(async dash => {
        const dId = dash.deviceId ?? null
        setDeviceId(dId)
        if (dId) {
          const g = await goalsApi.getForDevice(dId)
          setGoals(g)
        } else {
          const g = await goalsApi.getAll()
          setGoals(g)
        }
      })
      .catch(() => showToast('Failed to load goals', 'error'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addGoal = async () => {
    if (!form.title.trim() || !deviceId) {
      showToast('Please set up your device first', 'error')
      return
    }
    setSaving(true)
    try {
      const created = await goalsApi.create({
        deviceId,
        title: form.title,
        goalType: form.goalType,
        period: form.period,
        targetValue: form.targetValue,
      })
      setGoals(g => [...g, created])
      setForm({ title: '', goalType: 'FOCUS_MINUTES', period: 'DAILY', targetValue: 45 })
      setOpen(false)
      showToast('Goal added!', 'success')
    } catch {
      showToast('Failed to add goal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteGoal = async (id: string) => {
    setGoals(g => g.filter(x => x.id !== id))
    try { await goalsApi.delete(id) } catch {
      showToast('Failed to delete goal', 'error')
    }
  }

  const cfg = GOAL_TYPE_CONFIG
  const colorFor = (type: GoalType) =>
    cfg[type]?.isLimit ? '#EF4444' : '#7C3AED'

  return (
    <div className="p-6 fade-up max-w-3xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 font-bold text-xl">My Goals</h2>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-purple-600 hover:bg-purple-700 transition-colors">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No goals set yet. Add your first goal!
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(g => (
            <div key={g.id} className="bg-white rounded-2xl p-5 shadow-sm group relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cfg[g.goalType]?.emoji ?? '🎯'}</span>
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{g.title}</span>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {cfg[g.goalType]?.label} · {g.period}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${g.metToday ? 'text-green-600' : 'text-gray-600'}`}>
                    {g.progressLabel}
                  </span>
                  {g.metToday && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Met</span>}
                  <button onClick={() => deleteGoal(g.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(g.progressPercent, 100)}%`, background: colorFor(g.goalType) }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Goal">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Goal Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Study for 2 hours daily"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Goal Type *</label>
            <select value={form.goalType} onChange={e => {
              const t = e.target.value as GoalType
              setForm(f => ({ ...f, goalType: t, targetValue: cfg[t]?.defaultTarget ?? 30 }))
            }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              {(Object.keys(cfg) as GoalType[]).map(k => (
                <option key={k} value={k}>{cfg[k].emoji} {cfg[k].label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">Period</label>
              <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">
                Target ({cfg[form.goalType]?.unit || 'units'})
              </label>
              <input type="number" min={1} value={form.targetValue}
                onChange={e => setForm(f => ({ ...f, targetValue: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <button onClick={addGoal} disabled={saving || !form.title.trim()}
            className="w-full py-2.5 rounded-xl text-white font-medium text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            Add Goal
          </button>
        </div>
      </Modal>
    </div>
  )
}
