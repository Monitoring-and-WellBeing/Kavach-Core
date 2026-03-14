'use client'
import { useState, useEffect } from 'react'
import { BookOpen, Sparkles, RefreshCw, MessageSquare } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { studentDashboardApi } from '@/lib/studentDashboard'
import { studyBuddyApi, TopicSummary } from '@/lib/insights'

export default function LearningHub() {
  const { toast, showToast, hideToast } = useToast()
  const [topics, setTopics]   = useState<TopicSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    studentDashboardApi.get()
      .then(async dash => {
        // studentId is derived from the device's assigned user — use deviceId for now
        const sId = dash.deviceId ?? null
        setStudentId(sId)
        if (sId) {
          const t = await studyBuddyApi.getTopics(sId)
          setTopics(t)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h2 className="text-gray-900 font-bold text-xl">Learning Hub</h2>
        <p className="text-gray-500 text-sm">AI Study Buddy insights & your learning activity</p>
      </div>

      {/* AI Study Buddy Summary */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-semibold">AI Study Buddy</h3>
            <p className="text-white/70 text-xs">Your personalized learning assistant</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center text-white/70 text-sm">
            <RefreshCw size={14} className="animate-spin mr-2" /> Loading activity...
          </div>
        ) : topics ? (
          <div>
            <div className="text-3xl font-bold mb-1">
              {topics.totalQuestionsThisWeek}
            </div>
            <p className="text-white/70 text-sm">questions asked this week</p>

            {topics.topics.length > 0 && (
              <div className="mt-4">
                <p className="text-white/80 text-xs mb-2 uppercase tracking-wide font-medium">Recent Topics</p>
                <div className="flex flex-wrap gap-2">
                  {topics.topics.map((topic, i) => (
                    <span key={i}
                      className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-white/80 text-sm">No AI Study Buddy activity yet.</p>
            <p className="text-white/60 text-xs mt-1">Ask questions to see your learning summary here.</p>
          </div>
        )}
      </div>

      {/* How to use AI Study Buddy */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-purple-500" />
          <h3 className="font-semibold text-gray-900">How to Use AI Study Buddy</h3>
        </div>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Ask any study question', desc: 'Type your question about any subject — Math, Science, History, and more.' },
            { step: '2', title: 'Get instant explanations', desc: 'Receive clear, age-appropriate explanations tailored to your level.' },
            { step: '3', title: 'Practice & improve', desc: 'Request practice problems and track your understanding over time.' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning tips */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-blue-500" />
          <h3 className="font-semibold text-gray-900">Study Tips</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '🍅', title: 'Pomodoro Technique', desc: '25 min study, 5 min break' },
            { emoji: '📝', title: 'Active Recall', desc: 'Test yourself regularly' },
            { emoji: '🗓️', title: 'Spaced Repetition', desc: 'Review at increasing intervals' },
            { emoji: '🎯', title: 'Set Clear Goals', desc: 'Know what you want to achieve' },
          ].map((tip, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-2">{tip.emoji}</div>
              <div className="text-sm font-medium text-gray-800">{tip.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
