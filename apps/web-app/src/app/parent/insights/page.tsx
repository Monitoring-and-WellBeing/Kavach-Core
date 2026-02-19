'use client'
import { useState } from 'react'
import { X, AlertCircle, Info, TrendingUp, Shield } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockInsights } from '@/mock/insights'
import { AlertSeverity } from '@kavach/shared-types'

const severityColors: Record<AlertSeverity, { border: string; bg: string; text: string }> = {
  HIGH: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  MODERATE: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  LOW: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
}

const severityLabels: Record<AlertSeverity, string> = {
  HIGH: 'Critical',
  MODERATE: 'Attention',
  LOW: 'Info',
}

export default function InsightsPage() {
  const [insights, setInsights] = useState(mockInsights)
  const [filter, setFilter] = useState<AlertSeverity | 'All'>('All')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const { toast, showToast, hideToast } = useToast()

  const filtered = insights.filter(i => {
    if (dismissed.has(i.id)) return false
    return filter === 'All' || i.riskLevel === filter
  })

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
    showToast('Insight dismissed', 'info')
  }

  const handleUndo = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    showToast('Insight restored', 'success')
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div>
        <h2 className="text-gray-900 font-bold text-xl">AI Insights</h2>
        <p className="text-gray-500 text-sm">Smart insights powered by AI</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['All', 'HIGH', 'MODERATE', 'LOW'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilter(level as AlertSeverity | 'All')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === level
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {level === 'All' ? 'All' : severityLabels[level]}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      <div className="space-y-4">
        {filtered.map(insight => {
          const colors = severityColors[insight.riskLevel]
          return (
            <div key={insight.id} className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${colors.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                    {insight.riskLevel === 'HIGH' ? (
                      <AlertCircle size={20} className={colors.text} />
                    ) : insight.riskLevel === 'MODERATE' ? (
                      <TrendingUp size={20} className={colors.text} />
                    ) : (
                      <Info size={20} className={colors.text} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                        {severityLabels[insight.riskLevel]}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{new Date(insight.generatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(insight.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
              {insight.actionSuggested && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">💡 Suggested Action</p>
                  <p className="text-sm text-blue-700">{insight.actionSuggested}</p>
                </div>
              )}
            </div>
          )
        })}

        {/* Dismissed insights (collapsed) */}
        {insights.filter(i => dismissed.has(i.id)).length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-2">Dismissed insights</p>
            {insights.filter(i => dismissed.has(i.id)).map(insight => (
              <div key={insight.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-1">
                <span className="text-xs text-gray-500 line-through">{insight.title}</span>
                <button onClick={() => handleUndo(insight.id)} className="text-xs text-blue-500 hover:text-blue-600">
                  Undo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
