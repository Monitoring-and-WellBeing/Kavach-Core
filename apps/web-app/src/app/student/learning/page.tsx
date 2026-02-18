'use client'
import { useState } from 'react'
import { BookOpen, Play } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'

const subjects = [
  { id: 1, name: 'Mathematics', icon: '📐', hours: 12.5, progress: 75, chapters: '8/12', color: '#3B82F6' },
  { id: 2, name: 'Science', icon: '🔬', hours: 9.2, progress: 62, chapters: '6/10', color: '#22C55E' },
  { id: 3, name: 'English', icon: '📚', hours: 8.8, progress: 88, chapters: '7/8', color: '#F59E0B' },
  { id: 4, name: 'Coding', icon: '💻', hours: 15.3, progress: 45, chapters: '12/24', color: '#8B5CF6' },
]

export default function LearningHub() {
  const { toast, showToast, hideToast } = useToast()

  const handleContinue = (subject: string) => {
    showToast(`Opening ${subject} learning resources...`, 'info')
  }

  return (
    <div className="p-6 space-y-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div>
        <h2 className="text-gray-900 font-bold text-xl">Learning Hub</h2>
        <p className="text-gray-500 text-sm">Continue your learning journey</p>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-2 gap-4">
        {subjects.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{s.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <p className="text-gray-400 text-xs">Progress {s.progress}%</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Time Spent</span>
                <span className="text-sm font-semibold text-gray-700">{s.hours}h</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${s.progress}%`, background: s.color }} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">Chapters</span>
              <span className="text-sm font-semibold text-gray-700">{s.chapters}</span>
            </div>
            <button onClick={() => handleContinue(s.name)} className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90" style={{ background: s.color }}>
              Continue Learning
            </button>
          </div>
        ))}
      </div>

      {/* Recent Lessons */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Lessons</h3>
          <button className="text-blue-500 text-sm font-medium">View All →</button>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Quadratic Equations - Advanced', subject: 'Mathematics', time: '45 mins', score: 92 },
            { name: 'Photosynthesis Process', subject: 'Science', time: '30 mins', score: 85 },
            { name: 'Shakespeare - Macbeth Analysis', subject: 'English', time: '1 hour', score: null },
            { name: 'Python - Data Structures', subject: 'Coding', time: '50 mins', score: null },
          ].map((lesson, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-800">{lesson.name}</div>
                <div className="text-xs text-gray-400">{lesson.subject} · {lesson.time}</div>
              </div>
              {lesson.score ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">{lesson.score}%</span>
                  <span className="text-green-500">✓</span>
                </div>
              ) : (
                <button className="text-blue-500 text-sm font-medium flex items-center gap-1">
                  <Play size={14} /> Continue
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
