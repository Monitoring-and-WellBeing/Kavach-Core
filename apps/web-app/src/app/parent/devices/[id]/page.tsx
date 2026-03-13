'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Monitor, Clock, Shield, AlertTriangle, Camera, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useToast, Toast } from '@/components/ui/Toast'
import { devicesApi, Device } from '@/lib/devices'
import { reportsApi, AppUsage, WeeklyReport } from '@/lib/reports'
import { blockingApi, BlockRule } from '@/lib/blocking'
import { alertsApi, AlertItem } from '@/lib/alerts'
import { ScreenshotGallery } from '@/components/screenshots/ScreenshotGallery'

const tabs = ['Overview', 'App Usage', 'Rules', 'Alerts', 'Screenshots'] as const

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatSeconds(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function StatusBadge({ status }: { status: Device['status'] }) {
  const cfg = {
    ONLINE:     { bg: 'bg-green-100',  text: 'text-green-700' },
    OFFLINE:    { bg: 'bg-gray-100',   text: 'text-gray-700' },
    PAUSED:     { bg: 'bg-amber-100',  text: 'text-amber-700' },
    FOCUS_MODE: { bg: 'bg-blue-100',   text: 'text-blue-700' },
  }[status]
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview')
  const { toast, showToast, hideToast } = useToast()

  // ── State ──────────────────────────────────────────────────────────────────
  const [device, setDevice]   = useState<Device | null>(null)
  const [apps, setApps]       = useState<AppUsage | null>(null)
  const [weekly, setWeekly]   = useState<WeeklyReport | null>(null)
  const [rules, setRules]     = useState<BlockRule[]>([])
  const [alerts, setAlerts]   = useState<AlertItem[]>([])
  const [loadingDevice, setLoadingDevice] = useState(true)
  const [loadingTab, setLoadingTab]     = useState(false)

  // ── Load device ────────────────────────────────────────────────────────────
  useEffect(() => {
    devicesApi.get(id)
      .then(setDevice)
      .catch(() => setDevice(null))
      .finally(() => setLoadingDevice(false))
  }, [id])

  // ── Load tab data ──────────────────────────────────────────────────────────
  const loadTabData = useCallback(async (tab: (typeof tabs)[number]) => {
    if (!device) return
    setLoadingTab(true)
    try {
      if (tab === 'Overview') {
        const [w, a] = await Promise.all([
          reportsApi.getWeekly(device.id),
          reportsApi.getTopApps(device.id),
        ])
        setWeekly(w)
        setApps(a)
      } else if (tab === 'App Usage') {
        const a = await reportsApi.getTopApps(device.id)
        setApps(a)
      } else if (tab === 'Rules') {
        const r = await blockingApi.getRules()
        setRules(r.filter(rule => !rule.deviceId || rule.deviceId === device.id))
      } else if (tab === 'Alerts') {
        const page = await alertsApi.getAlerts(0, 30)
        setAlerts(page.alerts.filter(a => !a.deviceId || a.deviceId === device.id))
      }
    } catch {
      // silently fail — show empty state
    } finally {
      setLoadingTab(false)
    }
  }, [device])

  useEffect(() => {
    if (device) loadTabData(activeTab)
  }, [device, activeTab, loadTabData])

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loadingDevice) {
    return (
      <div className="p-6 flex items-center justify-center text-gray-400">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading device...
      </div>
    )
  }

  if (!device) {
    return <div className="p-6 text-center text-gray-500">Device not found or access denied.</div>
  }

  const weeklyBarData = weekly?.days.map(d => ({
    day: d.dayLabel,
    screenTime: Math.round(d.totalSeconds / 60),
  })) ?? []

  const topApps = apps?.apps.slice(0, 5).map(a => ({
    name: a.appName,
    minutes: Math.round(a.durationSeconds / 60),
    color: a.blocked ? '#EF4444' : '#3B82F6',
  })) ?? []

  const activeRuleCount = rules.filter(r => r.active).length

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <button onClick={() => router.push('/parent/devices')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft size={18} /> Back to Devices
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">{device.name}</h2>
          <p className="text-gray-500 text-sm">
            {device.assignedTo && `${device.assignedTo} · `}
            {device.osVersion || device.hostname || 'Unknown OS'}
          </p>
        </div>
        <StatusBadge status={device.status} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {loadingTab && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <RefreshCw size={16} className="animate-spin mr-2" /> Loading...
        </div>
      )}

      {!loadingTab && (
        <>
          {/* ── Overview ────────────────────────────────────────────────────── */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Clock size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Screen Time Today</div>
                      <div className="text-gray-900 text-xl font-bold">
                        {formatSeconds(device.screenTimeToday * 60)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <Monitor size={20} className="text-green-500" />
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Top App</div>
                      <div className="text-gray-900 text-xl font-bold">
                        {topApps[0]?.name || apps?.apps[0]?.appName || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Shield size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Active Rules</div>
                      <div className="text-gray-900 text-xl font-bold">{activeRuleCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              {weeklyBarData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Weekly Screen Time (minutes)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyBarData}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <Bar dataKey="screenTime" radius={[6, 6, 0, 0]} fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── App Usage ───────────────────────────────────────────────────── */}
          {activeTab === 'App Usage' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900">Top Apps (Last 7 Days)</h3>
              {topApps.length === 0 ? (
                <p className="text-gray-400 text-sm">No app usage data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topApps} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      label={{ value: 'minutes', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }} width={110} />
                    <Bar dataKey="minutes" radius={[0, 6, 6, 0]}>
                      {topApps.map((app, i) => <Cell key={i} fill={app.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {apps && apps.apps.length > 5 && (
                <div className="space-y-2 mt-2">
                  {apps.apps.slice(5).map((app, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{app.appName}</span>
                        <span className="ml-2 text-xs text-gray-400">{app.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{app.durationFormatted}</span>
                        {app.blocked && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Blocked</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Rules ───────────────────────────────────────────────────────── */}
          {activeTab === 'Rules' && (
            <div className="space-y-3">
              {rules.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-400">
                  No blocking rules configured for this device.
                </div>
              ) : (
                rules.map(rule => (
                  <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{rule.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {rule.ruleType.replace(/_/g, ' ')} — {rule.target}
                        </div>
                        {rule.scheduleEnabled && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {rule.scheduleStart}–{rule.scheduleEnd} · {rule.scheduleDays}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rule.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Alerts ──────────────────────────────────────────────────────── */}
          {activeTab === 'Alerts' && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-400">
                  No alerts for this device.
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${
                    alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'border-red-500' :
                    alert.severity === 'MEDIUM' ? 'border-amber-400' : 'border-blue-400'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{alert.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{alert.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        alert.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Screenshots ─────────────────────────────────────────────────── */}
          {activeTab === 'Screenshots' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50">
                  <Camera size={18} className="text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Screenshot History</h3>
                  <p className="text-xs text-gray-400">
                    Evidence captured on rule violations · Periodic snapshots during school hours
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <Shield size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Screenshot monitoring must be enabled in{' '}
                  <a href="/parent/settings" className="underline font-medium">Settings → Screenshots</a>.
                  Students are notified when monitoring is active. Screenshots auto-delete after 7 days.
                </p>
              </div>
              <ScreenshotGallery deviceId={device.id} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
