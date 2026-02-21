'use client'
import { useState, useEffect, useCallback } from 'react'
import { Target, Plus, Trash2, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { goalsApi, Goal, GoalType, GOAL_TYPE_CONFIG } from '@/lib/goals'
import { devicesApi, Device } from '@/lib/devices'
import { Modal } from '@/components/ui/Modal'
import { Toast, useToast } from '@/components/ui/Toast'

function ProgressBar({ goal }: { goal: Goal }) {
  const isLimit = GOAL_TYPE_CONFIG[goal.goalType].isLimit
  const pct = goal.progressPercent
  const barColor = isLimit
    ? (pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#22C55E')
    : (pct >= 100 ? '#22C55E' : '#3B82F6')

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-500 text-xs">{goal.progressLabel}</span>
        {goal.metToday
          ? <CheckCircle size={14} className="text-green-500" />
          : isLimit && pct >= 100
            ? <XCircle size={14} className="text-red-500" />
            : null}
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
      </div>
    </div>
  )
}

function HistoryDots({ history }: { history: Goal['history'] }) {
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {history.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5" title={`${day.dayLabel}: ${day.value}/${day.target}`}>
          <div className={`w-3 h-3 rounded-full ${day.met ? 'bg-green-500' : 'bg-gray-200'}`} />
          <span className="text-gray-300 text-xs">{day.dayLabel.charAt(0)}</span>
        </div>
      ))}
    </div>
  )
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: string) => void }) {
  const cfg = GOAL_TYPE_CONFIG[goal.goalType]
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${goal.metToday ? 'border-green-200' : 'border-transparent'}`}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cfg.emoji}</span>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{goal.title}</div>
            <div className="text-gray-400 text-xs">{goal.deviceName} · {goal.period}</div>
          </div>
        </div>
        <button onClick={() => onDelete(goal.id)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
      <ProgressBar goal={goal} />
      <HistoryDots history={goal.history} />
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const { toast, showToast, hideToast } = useToast()
  const [form, setForm] = useState({ deviceId: '', title: '', goalType: 'FOCUS_MINUTES' as GoalType, period: 'DAILY', targetValue: 45 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g, d] = await Promise.all([goalsApi.getAll(), devicesApi.list()])
      setGoals(g); setDevices(d)
      if (d.length > 0 && !form.deviceId) setForm(f => ({ ...f, deviceId: d[0].id }))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleTypeChange = (type: GoalType) => setForm(f => ({
    ...f, goalType: type, targetValue: GOAL_TYPE_CONFIG[type].defaultTarget
  }))

  const handleCreate = async () => {
    try {
      const created = await goalsApi.create(form)
      setGoals(prev => [created, ...prev])
      setCreateOpen(false)
      showToast('Goal created! Progress updates every 15 minutes.', 'success')
    } catch { showToast('Failed to create goal', 'error') }
  }

  const handleDelete = async (id: string) => {
    await goalsApi.delete(id)
    setGoals(prev => prev.filter(g => g.id !== id))
    showToast('Goal removed', 'info')
  }

  const metCount = goals.filter(g => g.metToday).length
  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-bold text-xl flex items-center gap-2">
            <Target size={20} className="text-blue-500" /> Goals
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{metCount} of {goals.length} goals met today</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {goals.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Today's Progress</span>
              <span>{metCount} / {goals.length} goals met</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-green-500 transition-all"
                style={{ width: `${goals.length ? (metCount / goals.length) * 100 : 0}%` }} />
            </div>
          </div>
          <TrendingUp size={20} className="text-gray-300 flex-shrink-0" />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-white rounded-2xl shadow-sm" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Target size={48} className="text-gray-200 mb-3" />
          <h3 className="text-gray-500 font-semibold">No goals yet</h3>
          <p className="text-gray-400 text-sm mt-1 mb-4">Set goals to help your child build better habits</p>
          <button onClick={() => setCreateOpen(true)} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: '#2563EB' }}>
            Add First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map(goal => <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} />)}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Goal" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Device</label>
            <select value={form.deviceId} onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))} className={inputClass}>
              {devices.map(d => <option key={d.id} value={d.id}>{d.assignedTo || d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Goal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(GOAL_TYPE_CONFIG) as [GoalType, any][]).map(([type, cfg]) => (
                <button key={type} onClick={() => handleTypeChange(type)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.goalType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="text-lg">{cfg.emoji}</div>
                  <div className="font-medium text-gray-700 text-xs mt-0.5">{cfg.label}</div>
                  <div className="text-gray-400 text-xs">{cfg.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-600 text-xs font-medium block mb-1.5">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Daily focus goal" className={inputClass} />
            </div>
            {GOAL_TYPE_CONFIG[form.goalType].unit !== '' && (
              <div>
                <label className="text-gray-600 text-xs font-medium block mb-1.5">Target ({GOAL_TYPE_CONFIG[form.goalType].unit})</label>
                <input type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))} min={1} max={1440} className={inputClass} />
              </div>
            )}
          </div>

          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Period</label>
            <div className="flex gap-2">
              {['DAILY','WEEKLY'].map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, period: p }))}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${form.period === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleCreate} disabled={!form.title || !form.deviceId}
            className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            Create Goal
          </button>
        </div>
      </Modal>
    </div>
  )
}
