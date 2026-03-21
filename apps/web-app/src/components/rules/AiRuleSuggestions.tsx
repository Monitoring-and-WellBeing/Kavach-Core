'use client'
import { useState, useEffect } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Check, Clock, Shield } from 'lucide-react'
import { ruleSuggestionsApi, RuleSuggestion } from '@/lib/insights'
import { blockingApi } from '@/lib/blocking'

interface Props {
  onRuleApplied?: () => void
}

const RULE_TYPE_ICONS: Record<string, React.ReactNode> = {
  SCHEDULE: <Clock size={14} className="text-blue-500" />,
  CATEGORY: <Shield size={14} className="text-purple-500" />,
  APP:      <Shield size={14} className="text-red-500" />,
}

export default function AiRuleSuggestions({ onRuleApplied }: Props) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<RuleSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)

  // Load suggestions when panel is opened
  useEffect(() => {
    if (!open || suggestions.length > 0) return
    setLoading(true)
    ruleSuggestionsApi.getSuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }, [open])

  const handleApply = async (s: RuleSuggestion) => {
    if (applied.has(s.id) || applying) return
    setApplying(s.id)

    try {
      await blockingApi.createRule({
        name: `AI: ${s.suggestion.slice(0, 50)}`,
        ruleType: s.ruleType === 'SCHEDULE' ? 'APP' : s.ruleType as 'APP' | 'CATEGORY',
        target: s.target,
        appliesTo: 'ALL_DEVICES',
        scheduleEnabled: s.ruleType === 'SCHEDULE',
        scheduleDays: 'MON,TUE,WED,THU,FRI,SAT,SUN',
        scheduleStart: s.scheduleStart || '21:00',
        scheduleEnd: s.scheduleEnd || '23:59',
        showMessage: true,
        blockMessage: 'This has been restricted by your parent.',
        active: true,
      })

      setApplied((prev) => new Set(prev).add(s.id))
      onRuleApplied?.()
    } catch {
      // silently fail
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-purple-500" />
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              AI Rule Suggestions
              {suggestions.length > 0 && !open && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {suggestions.length - applied.size} new
                </span>
              )}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              Based on your child's usage patterns
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Content */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          {loading ? (
            <div className="py-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No suggestions right now</p>
              <p className="text-gray-300 text-xs mt-1">
                Check back after a few days of usage data
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {suggestions.map((s) => {
                const isApplied = applied.has(s.id)
                const isApplying = applying === s.id

                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isApplied
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-100 bg-gray-50 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {RULE_TYPE_ICONS[s.ruleType] || RULE_TYPE_ICONS.APP}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 text-sm font-medium leading-snug">
                          {s.reason}
                        </p>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                          💡 {s.suggestion}
                        </p>
                        {s.scheduleStart && (
                          <p className="text-blue-500 text-xs mt-1">
                            ⏰ {s.scheduleStart} – {s.scheduleEnd}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleApply(s)}
                        disabled={isApplied || !!isApplying}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isApplied
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
                        }`}
                      >
                        {isApplied ? (
                          <><Check size={12} /> Applied</>
                        ) : isApplying ? (
                          'Applying...'
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
