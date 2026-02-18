'use client'
import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Zap } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'

const PRESETS = [
  { label: '25 min', value: 25, desc: 'Pomodoro' },
  { label: '50 min', value: 50, desc: 'Deep Work' },
  { label: '90 min', value: 90, desc: 'Flow State' },
  { label: 'Custom', value: 0, desc: 'Set your own' },
]

const sessionHistory = [
  { date: 'Today', duration: '50 min', status: 'Completed', score: 95 },
  { date: 'Yesterday', duration: '25 min', status: 'Completed', score: 88 },
  { date: 'Yesterday', duration: '90 min', status: 'Interrupted', score: 62 },
  { date: 'Mon, Feb 17', duration: '50 min', status: 'Completed', score: 91 },
]

export default function FocusMode() {
  const [selected, setSelected] = useState(25)
  const [custom, setCustom] = useState('')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const totalSeconds = (selected || parseInt(custom) || 25) * 60

  useEffect(() => {
    setSeconds(totalSeconds)
    setFinished(false)
  }, [selected, custom])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(interval); setRunning(false); setFinished(true); showToast('Focus session complete! Great work 🎉', 'success'); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, showToast])

  const start = () => { setRunning(true); setFinished(false) }
  const pause = () => setRunning(false)
  const stop = () => { setRunning(false); setSeconds(totalSeconds); setFinished(false) }

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  const progress = 1 - seconds / totalSeconds
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6">
        {/* Timer card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center">
          <h2 className="text-gray-900 font-bold text-xl mb-6">Focus Mode</h2>

          {/* Circular SVG timer */}
          <div className="relative mb-6">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="90" fill="none" stroke="#F3F4F6" strokeWidth="10" />
              <circle cx="110" cy="110" r="90" fill="none" stroke={finished ? '#22C55E' : '#7C3AED'} strokeWidth="10"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 110 110)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold text-gray-900 ${running ? 'timer-pulse' : ''}`}>{mins}:{secs}</div>
              <div className="text-gray-400 text-sm mt-1">{running ? 'Focusing...' : finished ? 'Complete!' : 'Ready'}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!running ? (
              <button onClick={start} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}>
                <Play size={18} /> Start
              </button>
            ) : (
              <button onClick={pause} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors">
                <Pause size={18} /> Pause
              </button>
            )}
            <button onClick={stop} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors">
              <Square size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Presets */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Session Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => { setSelected(p.value); if (p.value !== 0) setCustom('') }}
                  className={`p-3 rounded-xl text-left transition-all border-2 ${selected === p.value ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className={`font-semibold text-sm ${selected === p.value ? 'text-purple-700' : 'text-gray-700'}`}>{p.label}</div>
                  <div className="text-xs text-gray-400">{p.desc}</div>
                </button>
              ))}
            </div>
            {selected === 0 && (
              <div className="mt-3">
                <input type="number" placeholder="Enter minutes" value={custom} onChange={e => setCustom(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            )}
          </div>

          {/* Session history */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Session History</h3>
            <div className="space-y-2">
              {sessionHistory.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{s.duration}</div>
                    <div className="text-xs text-gray-400">{s.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{s.score}%</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
