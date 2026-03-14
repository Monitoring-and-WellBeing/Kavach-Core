'use client'
import { useState, useEffect, useCallback } from 'react'
import { Monitor, Wifi, WifiOff, Target, Shield, Bell,
         RefreshCw, ChevronDown, CheckSquare, Square,
         Pause, Play, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { instituteDashboardApi, type InstituteDashboard, type InstituteDevice } from '@/lib/instituteDashboard'
import { Toast, useToast } from '@/components/ui/Toast'

// ── Category colors ────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  EDUCATION: '#3B82F6', GAMING: '#EF4444', ENTERTAINMENT: '#F59E0B',
  SOCIAL_MEDIA: '#8B5CF6', PRODUCTIVITY: '#22C55E',
  COMMUNICATION: '#06B6D4', OTHER: '#9CA3AF',
}

type Filter = 'ALL' | 'ONLINE' | 'OFFLINE' | 'PAUSED' | 'FOCUS'
type SortKey = 'name' | 'status' | 'screenTime' | 'blocked'

// ── Compliance score gauge ─────────────────────────────────────────────────────
function ComplianceGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Low'
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r="30" fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 30}
            strokeDashoffset={2 * Math.PI * 30 * (1 - score / 100)}
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{score}</span>
        </div>
      </div>
      <div>
        <div className="font-semibold text-gray-800">Compliance</div>
        <div className="text-sm font-medium" style={{ color }}>{label}</div>
        <div className="text-gray-400 text-xs mt-0.5">Active device rate</div>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs">{label}</span>
        <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-gray-400 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Device row ────────────────────────────────────────────────────────────────
function DeviceRow({
  device, selected, onSelect
}: {
  device: InstituteDevice
  selected: boolean
  onSelect: (id: string) => void
}) {
  const statusConfig = {
    ONLINE:     { dot: 'bg-green-500', label: 'Online',     text: 'text-green-600', pulse: true },
    OFFLINE:    { dot: 'bg-gray-400',  label: 'Offline',    text: 'text-gray-500',  pulse: false },
    PAUSED:     { dot: 'bg-amber-500', label: 'Paused',     text: 'text-amber-600', pulse: false },
    FOCUS_MODE: { dot: 'bg-blue-500',  label: 'Focus',      text: 'text-blue-600',  pulse: true },
  }[device.status] || { dot: 'bg-gray-300', label: device.status, text: 'text-gray-500', pulse: false }

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${selected ? 'bg-blue-50' : ''}`}>
      <td className="pl-4 py-3">
        <button onClick={() => onSelect(device.id)}
          className="text-gray-400 hover:text-blue-500 transition-colors">
          {selected
            ? <CheckSquare size={16} className="text-blue-500" />
            : <Square size={16} />}
        </button>
      </td>
      <td className="py-3 pr-4">
        <div className="font-medium text-gray-800 text-sm">{device.name}</div>
        {device.assignedTo && (
          <div className="text-gray-400 text-xs">{device.assignedTo}</div>
        )}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dot} ${statusConfig.pulse ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium ${statusConfig.text}`}>{statusConfig.label}</span>
          {device.inFocus && (
            <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
              Focus
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-gray-700 text-sm">{device.screenTimeFormatted || '0m'}</td>
      <td className="py-3 pr-4 text-gray-500 text-sm">{device.topApp || '—'}</td>
      <td className="py-3 pr-4">
        {device.blockedAttempts > 0 ? (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
            {device.blockedAttempts} blocked
          </span>
        ) : (
          <span className="text-gray-300 text-xs">None</span>
        )}
      </td>
      <td className="py-3 pr-4 text-gray-400 text-xs">
        {device.lastSeen
          ? new Date(device.lastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : 'Never'}
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InstituteDashboard() {
  const [data, setData] = useState<InstituteDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>('ALL')
  const [sort, setSort] = useState<SortKey>('status')
  const [bulkLoading, setBulkLoading] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const load = useCallback(async () => {
    try {
      setData(await instituteDashboardApi.get())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkAction = async (action: 'PAUSE' | 'RESUME' | 'FOCUS') => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const result = await instituteDashboardApi.bulkAction(action, Array.from(selected))
      showToast(`${action}: ${result.succeeded}/${result.requested} devices updated`)
      setSelected(new Set())
      load()
    } catch {
      showToast('Bulk action failed', 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-white rounded-2xl shadow-sm" />)}
        </div>
        <div className="h-96 bg-white rounded-2xl shadow-sm" />
      </div>
    )
  }

  if (!data) return null

  const { stats, devices, topApps } = data

  // Filter + sort devices
  const filteredDevices = devices
    .filter(d => {
      if (filter === 'ALL') return true
      if (filter === 'FOCUS') return d.inFocus
      return d.status === filter
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name':       return a.name.localeCompare(b.name)
        case 'screenTime': return b.screenTimeSeconds - a.screenTimeSeconds
        case 'blocked':    return b.blockedAttempts - a.blockedAttempts
        case 'status': {
          const order = { ONLINE: 0, FOCUS_MODE: 1, PAUSED: 2, OFFLINE: 3 }
          return (order[a.status] ?? 4) - (order[b.status] ?? 4)
        }
        default: return 0
      }
    })

  const selectAll = () => {
    const visible = filteredDevices.map(d => d.id)
    setSelected(prev =>
      prev.size === visible.length ? new Set() : new Set(visible)
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
            <div>
          <h1 className="text-gray-900 font-bold text-lg md:text-xl">Institute Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {stats.totalDevices} devices · {stats.onlineDevices} online now
          </p>
            </div>
        <button onClick={load}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors flex-shrink-0">
          <RefreshCw size={16} />
        </button>
          </div>

      {/* ── Top row: compliance + stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Compliance gauge */}
        <div className="col-span-2 bg-white rounded-2xl p-4 md:p-5 shadow-sm flex items-center">
          <ComplianceGauge score={stats.complianceScore} />
        </div>

        {/* Stat cards */}
        <StatCard label="Online Now" value={stats.onlineDevices}
          sub={`of ${stats.totalDevices} total`}
          icon={<Wifi size={14} className="text-green-600" />} color="bg-green-50" />
        <StatCard label="In Focus" value={stats.focusDevices}
          sub="Active sessions"
          icon={<Target size={14} className="text-purple-600" />} color="bg-purple-50" />
        <StatCard label="Blocked Today" value={stats.blockedAttemptsToday}
          sub="App attempts"
          icon={<Shield size={14} className="text-red-600" />} color="bg-red-50" />
        <StatCard label="Alerts" value={stats.unreadAlerts}
          sub="Unread"
          icon={<Bell size={14} className="text-amber-600" />} color="bg-amber-50" />
      </div>

      {/* ── Main content: device table + top apps ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-5">

        {/* Device table — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm">
          {/* Table header / controls */}
          <div className="p-3 md:p-4 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3">
            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto w-full sm:w-auto">
              {(['ALL','ONLINE','OFFLINE','PAUSED','FOCUS'] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-shrink-0 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {f === 'ALL' ? `All (${stats.totalDevices})` :
                   f === 'ONLINE' ? `Online (${stats.onlineDevices})` :
                   f === 'OFFLINE' ? `Offline (${stats.offlineDevices})` :
                   f === 'PAUSED' ? `Paused (${stats.pausedDevices})` :
                   `Focus (${stats.focusDevices})`}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative sm:ml-auto">
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 pr-7 focus:outline-none">
                <option value="status">Sort: Status</option>
                <option value="name">Sort: Name</option>
                <option value="screenTime">Sort: Screen Time</option>
                <option value="blocked">Sort: Blocked</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Bulk action toolbar — shows when items selected */}
          {selected.size > 0 && (
            <div className="px-3 md:px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-blue-700 text-sm font-medium">
                {selected.size} device{selected.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <button onClick={() => handleBulkAction('PAUSE')} disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors disabled:opacity-50">
                  <Pause size={12} /> Pause All
                </button>
                <button onClick={() => handleBulkAction('RESUME')} disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50">
                  <Play size={12} /> Resume All
                </button>
                <button onClick={() => handleBulkAction('FOCUS')} disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Target size={12} /> Focus All (25m)
                </button>
                <button onClick={() => setSelected(new Set())}
                  className="text-gray-400 hover:text-gray-600 text-xs underline">
                  Clear
                </button>
        </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pl-4 py-3 text-left w-8">
                    <button onClick={selectAll} className="text-gray-400 hover:text-blue-500">
                      {selected.size === filteredDevices.length && filteredDevices.length > 0
                        ? <CheckSquare size={16} className="text-blue-500" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  {['Device', 'Status', 'Screen Time', 'Top App', 'Blocked', 'Last Seen'].map(h => (
                    <th key={h} className="py-3 pr-4 text-left text-gray-400 text-xs font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-300 text-sm">
                      No devices match this filter
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map(device => (
                    <DeviceRow key={device.id} device={device}
                      selected={selected.has(device.id)}
                      onSelect={toggleSelect} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top apps sidebar — 1 col */}
        <div className="lg:col-span-1 space-y-4">
          {/* Top apps institute-wide */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-800 text-sm">Top Apps Today</h3>
              <p className="text-gray-400 text-xs">Institute-wide</p>
            </div>
            <div className="p-3 space-y-2.5">
              {topApps.length === 0 ? (
                <p className="text-gray-300 text-xs text-center py-4">No data yet</p>
              ) : (
                topApps.map((app, i) => {
                  const mins = Math.floor(app.durationSeconds / 60)
                  const totalMins = topApps.reduce((s, a) => s + a.durationSeconds, 0) / 60
                  const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0
                  return (
                    <div key={app.appName}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-300 text-xs w-4">{i + 1}</span>
                        <span className="flex-1 text-gray-700 text-xs truncate">{app.appName}</span>
                        <span className="text-gray-400 text-xs">{mins}m</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1 ml-6">
                        <div className="h-1 rounded-full"
                          style={{ width: `${pct}%`, background: CAT_COLORS[app.category] || '#9CA3AF' }} />
            </div>
          </div>
                  )
                })
              )}
        </div>
      </div>

          {/* Quick links */}
          <div className="space-y-2">
            {[
              { href: '/institute/reports', icon: '📊', label: 'Reports' },
              { href: '/institute/devices', icon: '💻', label: 'All Devices' },
              { href: '/parent/control',    icon: '🛡️', label: 'Block Rules' },
              { href: '/parent/rules',      icon: '🔔', label: 'Alerts' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors">
                <span className="text-base">{link.icon}</span>
                <span className="text-gray-700 text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
