'use client'
import { useState, useEffect, useCallback } from 'react'
import { Sparkles, RefreshCw, ChevronDown, AlertTriangle,
         CheckCircle, Lightbulb, TrendingUp, Shield, Clock } from 'lucide-react'
import { insightsApi, DeviceInsight, InsightCard, RiskLevel } from '@/lib/insights'
import { devicesApi, Device } from '@/lib/devices'
import { Toast, useToast } from '@/components/ui/Toast'

// ── Config maps ───────────────────────────────────────────────────────────────
const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  LOW:      { label: 'Low Risk',      color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  MEDIUM:   { label: 'Medium Risk',   color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  HIGH:     { label: 'High Risk',     color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  CRITICAL: { label: 'Critical Risk', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string }> = {
  SPIKE:    { icon: <TrendingUp size={16} className="text-red-500" />,    bg: 'bg-red-50',    border: 'border-red-100' },
  WARNING:  { icon: <AlertTriangle size={16} className="text-amber-500" />, bg: 'bg-amber-50',  border: 'border-amber-100' },
  POSITIVE: { icon: <CheckCircle size={16} className="text-green-500" />,  bg: 'bg-green-50',  border: 'border-green-100' },
  TIP:      { icon: <Lightbulb size={16} className="text-blue-500" />,     bg: 'bg-blue-50',   border: 'border-blue-100' },
}

const TAG_LABELS: Record<string, string> = {
  late_night_usage:       '🌙 Late Night',
  excessive_gaming:       '🎮 Gaming Overuse',
  social_media_overuse:   '📱 Social Media',
  low_productivity:       '📉 Low Productivity',
  declining_focus:        '😴 Declining Focus',
  screen_time_spike:      '📈 Usage Spike',
  blocked_app_attempts:   '🚫 Block Attempts',
  study_streak:           '📚 Study Streak',
  focus_sessions_completed: '🎯 Focus Done',
  education_dominant:     '🏫 Study-Focused',
  improving_pattern:      '✨ Improving',
  healthy_screen_time:    '✅ Healthy Usage',
  consistent_schedule:    '🗓️ Consistent',
  data_collected:         '📊 Monitoring Active',
}

// ── Insight card component ─────────────────────────────────────────────────────
function InsightCardView({ card }: { card: InsightCard }) {
  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.TIP
  return (
    <div className={`rounded-2xl p-4 border ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{card.icon}</span>
            <span className="font-semibold text-gray-800 text-sm">{card.title}</span>
          </div>
          <p className="text-gray-600 text-sm mt-1 leading-relaxed">{card.body}</p>
        </div>
      </div>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function InsightSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-3/5" />
        </div>
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-2/5 mb-2" />
          <div className="h-3 bg-gray-100 rounded" />
          <div className="h-3 bg-gray-100 rounded w-4/5 mt-1" />
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [insight, setInsight] = useState<DeviceInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  // Load devices on mount
  useEffect(() => {
    devicesApi.list().then(list => {
      setDevices(list)
      if (list.length > 0) setSelectedDeviceId(list[0].id)
    })
  }, [])

  // Load insights when device selected
  const loadInsights = useCallback(async (deviceId: string) => {
    setLoading(true)
    setInsight(null)
    try {
      const data = await insightsApi.get(deviceId)
      setInsight(data)
    } catch {
      showToast('Failed to load insights', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (selectedDeviceId) loadInsights(selectedDeviceId)
  }, [selectedDeviceId, loadInsights])

  const handleRefresh = async () => {
    if (!selectedDeviceId) return
    setGenerating(true)
    try {
      showToast('Generating fresh AI insights... this may take 10–15 seconds', 'info')
      const data = await insightsApi.refresh(selectedDeviceId)
      setInsight(data)
      showToast('AI insights updated!', 'success')
    } catch {
      showToast('Failed to generate insights', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId)
  const riskCfg = insight ? RISK_CONFIG[insight.riskLevel] : RISK_CONFIG.LOW

  return (
    <div className="p-4 md:p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-gray-900 font-bold text-lg md:text-xl flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            AI Insights
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Powered by Claude · Analyzes last 7 days of usage
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Device selector */}
          <div className="relative">
            <select value={selectedDeviceId || ''}
              onChange={e => setSelectedDeviceId(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-xl px-4 h-11 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.assignedTo || d.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button onClick={handleRefresh} disabled={generating || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
            <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating...' : 'Refresh AI'}
          </button>
        </div>
      </div>

      {!selectedDeviceId && (
        <div className="flex flex-col items-center justify-center py-24">
          <span className="text-5xl mb-3">🤖</span>
          <p className="text-gray-500 font-medium">Select a device to view AI insights</p>
        </div>
      )}

      {selectedDeviceId && loading && <InsightSkeleton />}

      {selectedDeviceId && !loading && insight && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">

          {/* ── Left: summary + risk ── */}
          <div className="col-span-1 space-y-4">

            {/* Risk level card */}
            <div className={`rounded-2xl p-5 border ${riskCfg.bg} ${riskCfg.border}`}>
              <div className="flex items-center gap-3 mb-3">
                {insight.riskLevel === 'LOW'
                  ? <Shield size={20} className="text-green-600" />
                  : <AlertTriangle size={20} className={
                      insight.riskLevel === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'
                    } />}
                <div>
                  <div className={`font-bold text-sm ${riskCfg.color}`}>{riskCfg.label}</div>
                  <div className="text-gray-500 text-xs">
                    {selectedDevice?.assignedTo || selectedDevice?.name}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{insight.weeklySummary}</p>
            </div>

            {/* Risk tags */}
            {insight.riskTags.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-gray-500 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-red-400" /> Concerns
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insight.riskTags.map(tag => (
                    <span key={tag}
                      className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full font-medium">
                      {TAG_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Positive tags */}
            {insight.positiveTags.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-gray-500 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green-500" /> Positives
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insight.positiveTags.map(tag => (
                    <span key={tag}
                      className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full font-medium">
                      {TAG_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Generated at */}
            <div className="flex items-center gap-2 text-gray-400 text-xs px-1">
              <Clock size={12} />
              Last generated: {new Date(insight.generatedAt).toLocaleString('en-IN', {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
              {!insight.fresh && (
                <span className="text-amber-500 ml-1">(cached)</span>
              )}
            </div>
          </div>

          {/* ── Right: insight cards ── */}
          <div className="col-span-2 space-y-3">
            <h2 className="font-semibold text-gray-700 text-sm mb-1">
              {insight.insights.length} AI-Generated Insights
            </h2>
            {insight.insights
              .sort((a, b) => (a.priority || 99) - (b.priority || 99))
              .map((card, i) => (
                <InsightCardView key={i} card={card} />
              ))}

            {insight.insights.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">🤔</span>
                <p className="text-gray-500 font-medium">No insights generated yet</p>
                <p className="text-gray-400 text-sm mt-1">Click "Refresh AI" to generate insights</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
