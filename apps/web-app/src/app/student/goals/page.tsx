'use client'
import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, Toast } from '@/components/ui/Toast'

const initialGoals = [
  { id: 1, label: 'Daily study — 4 hours', current: 3.4, target: 4, unit: 'h', color: '#3B82F6' },
  { id: 2, label: 'Focus sessions this week', current: 5, target: 7, unit: '', color: '#7C3AED' },
  { id: 3, label: 'Weekend screen time limit', current: 3.2, target: 4, unit: 'h', color: '#22C55E' },
  { id: 4, label: 'No social media today', current: 0, target: 1, unit: 'day', color: '#F59E0B' },
]

export default function Goals() {
  const [goals, setGoals] = useState(initialGoals)
  const [open, setOpen] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const { toast, showToast, hideToast } = useToast()

  const addGoal = () => {
    if (!newGoal.trim()) return
    setGoals(g => [...g, { id: Date.now(), label: newGoal, current: 0, target: 1, unit: '', color: '#8B5CF6' }])
    setNewGoal(''); setOpen(false); showToast('Goal added successfully!', 'success')
  }

  return (
    <div className="p-6 fade-up max-w-3xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 font-bold text-xl">My Goals</h2>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#7C3AED' }}>
          <Plus size={16} /> Add Goal
        </button>
      </div>
      <div className="space-y-3">
        {goals.map(g => (
          <div key={g.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Target size={16} style={{ color: g.color }} /><span className="font-medium text-gray-800">{g.label}</span></div>
              <span className="text-sm font-semibold text-gray-600">{g.current}/{g.target}{g.unit}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((g.current / g.target) * 100, 100)}%`, background: g.color }} />
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add New Goal">
        <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="e.g. Study Physics for 2 hours"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4" />
        <button onClick={addGoal} className="w-full py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: '#7C3AED' }}>Add Goal</button>
      </Modal>
    </div>
  )
}
