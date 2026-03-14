'use client'
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Circle, Calendar, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'

interface Task {
  id: string
  label: string
  scheduledTime: string | null
  completed: boolean
  createdAt: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

export default function SchedulePage() {
  const { user } = useAuth()
  const [tasks, setTasks]     = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(today)
  const [newLabel, setNewLabel]     = useState('')
  const [newTime, setNewTime]       = useState('')
  const [addOpen, setAddOpen]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const { data } = await api.get<Task[]>(`/tasks/student/${user.id}`)
      setTasks(data)
    } catch {
      showToast('Failed to load tasks', 'error')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const toggleTask = async (taskId: string) => {
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    )
    try {
      await api.put(`/tasks/${taskId}/complete`)
    } catch {
      load() // roll back on error
    }
  }

  const addTask = async () => {
    if (!newLabel.trim() || !user?.id) return
    setSaving(true)
    try {
      const { data } = await api.post<Task>('/tasks', {
        studentId: user.id,
        label: newLabel.trim(),
        scheduledTime: newTime || null,
      })
      setTasks(prev => [...prev, data])
      setNewLabel('')
      setNewTime('')
      setAddOpen(false)
      showToast('Task added!', 'success')
    } catch {
      showToast('Failed to add task', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try { await api.delete(`/tasks/${taskId}`) } catch {
      load()
    }
  }

  // Filter tasks by selected day (tasks don't have day—show all, sorted by scheduledTime)
  // For now show all tasks. TODO: add a day/date field to tasks.
  const dayTasks = tasks.filter(t => {
    if (!t.scheduledTime) return true
    return true // show all tasks; future: filter by scheduled date
  })

  return (
    <div className="p-6 space-y-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">Schedule</h2>
          <p className="text-gray-500 text-sm">Your task schedule</p>
        </div>
        <button onClick={() => setAddOpen(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-purple-600 hover:bg-purple-700 transition-colors">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Add task inline form */}
      {addOpen && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="text-sm font-semibold text-gray-800">New Task</h4>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Task description"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <div className="flex gap-3">
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={addTask} disabled={saving || !newLabel.trim()}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : null} Add
            </button>
          </div>
        </div>
      )}

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map(day => (
          <button key={day} onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">{selectedDay}</h3>
          <span className="text-xs text-gray-400 ml-auto">
            {dayTasks.filter(t => t.completed).length}/{dayTasks.length} done
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading...
          </div>
        ) : dayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No tasks yet. Add your first task!
          </div>
        ) : (
          <div className="space-y-2">
            {dayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <button onClick={() => toggleTask(task.id)} className="shrink-0">
                  {task.completed
                    ? <CheckCircle size={20} className="text-green-500" />
                    : <Circle size={20} className="text-gray-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {task.label}
                  </div>
                  {task.scheduledTime && (
                    <div className="text-xs text-gray-400">{task.scheduledTime}</div>
                  )}
                </div>
                <button onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
