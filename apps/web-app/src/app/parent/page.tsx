'use client'
import { useState, useEffect, useCallback } from 'react'
import { Monitor, Wifi, WifiOff, Target, Shield,
         Bell, Clock, ChevronRight, RefreshCw,
         AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'
import { dashboardApi, type ParentDashboard, type DeviceSummary, type DashboardAlert } from '@/lib/dashboard'
import { alertsApi } from '@/lib/alerts'
import { FocusControl } from '@/components/FocusControl'

// ── Severity config ────────────────────────────────────────────────────────────
const SEVERITY = {
  CRITICAL: { icon: <AlertTriangle size={14} className="text-red-500" />,   bg: 'bg-red-50',    text: 'text-red-700' },
  HIGH:     { icon: <AlertTriangle size={14} className="text-orange-500" />, bg: 'bg-orange-50', text: 'text-orange-700' },
  MEDIUM:   { icon: <Info size={14} className="text-amber-500" />,           bg: 'bg-amber-50',  text: 'text-amber-700' },
  LOW:      { icon: <Info size={14} className="text-blue-400" />,            bg: 'bg-blue-50',   text: 'text-blue-700' },
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string
}) {
      return (
    <div className="bg-white rounded-2xl p-3 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-xs font-medium">{label}</span>
        <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-gray-400 text-xs mt-1">{sub}</div>}
    </div>
  )
}

// ── Device summary card ───────────────────────────────────────────────────────
function DeviceCard({ device, onFocusChange }: {
  device: DeviceSummary
  onFocusChange: () => void
}) {
  const statusConfig = {
    ONLINE:     { dot: 'bg-green-500', label: 'Online',     text: 'text-green-600' },
    OFFLINE:    { dot: 'bg-gray-400',  label: 'Offline',    text: 'text-gray-500' },
    PAUSED:     { dot: 'bg-amber-500', label: 'Paused',     text: 'text-amber-600' },
    FOCUS_MODE: { dot: 'bg-blue-500',  label: 'Focus Mode', text: 'text-blue-600' },
  }[device.status] || { dot: 'bg-gray-300', label: device.status, text: 'text-gray-500' }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Monitor size={16} className="text-gray-400" />
          <span className="font-semibold text-gray-800 text-sm truncate max-w-28">
            {device.assignedTo || device.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dot} ${device.status === 'ONLINE' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium ${statusConfig.text}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Screen time</span>
          <span className="text-gray-700 text-xs font-medium">
            {device.screenTimeFormatted || '0m'}
          </span>
        </div>
        {device.topApp && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Top app</span>
            <span className="text-gray-700 text-xs font-medium truncate max-w-24">{device.topApp}</span>
          </div>
        )}
        {device.inFocus && (
          <div className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-2 py-1">
            <Target size={11} className="text-blue-500" />
            <span className="text-blue-600 text-xs font-medium">Focus active</span>
          </div>
        )}
      </div>

      {/* Focus control */}
      <FocusControl
        deviceId={device.id}
        deviceName={device.assignedTo || device.name}
        onSessionChange={onFocusChange}
      />
        </div>
  )
}

// ── Alert row ─────────────────────────────────────────────────────────────────
function AlertRow({ alert, onMarkRead }: {
  alert: DashboardAlert
  onMarkRead: (id: string) => void
}) {
  const cfg = SEVERITY[alert.severity] || SEVERITY.MEDIUM
  return (
    <div
      onClick={() => !alert.read && onMarkRead(alert.id)}
      className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-gray-50 ${!alert.read ? 'bg-orange-50/50' : ''}`}>
      <div className="mt-0.5">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-700 text-xs font-medium leading-tight line-clamp-2">{alert.title}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {new Date(alert.triggeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
          </div>
      {!alert.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
            </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const [data, setData] = useState<ParentDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const dashboard = await dashboardApi.getParent()
      setData(dashboard)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard load failed', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const handleMarkRead = async (id: string) => {
    await alertsApi.markRead(id)
    setData(prev => prev ? {
      ...prev,
      recentAlerts: prev.recentAlerts.map(a =>
        a.id === id ? { ...a, read: true } : a),
      stats: { ...prev.stats, unreadAlerts: Math.max(0, prev.stats.unreadAlerts - 1) }
    } : prev)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse shadow-sm" />)}
            </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse shadow-sm" />)}
        </div>
          </div>
    )
  }

  if (!data) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-gray-500 font-medium">Failed to load dashboard</p>
        <button onClick={load} className="mt-2 text-blue-500 text-sm underline">Retry</button>
            </div>
          </div>
  )

  const { stats, devices, recentAlerts } = data

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 fade-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-bold text-lg md:text-xl">Overview</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button onClick={load} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Clock size={16} className="text-blue-600" />}
          label="Screen Time Today"
          value={stats.totalScreenTimeFormatted}
          sub="All devices combined"
          color="bg-blue-50"
        />
        <StatCard
          icon={stats.activeDevices > 0
            ? <Wifi size={16} className="text-green-600" />
            : <WifiOff size={16} className="text-gray-400" />}
          label="Active Devices"
          value={`${stats.activeDevices} / ${stats.totalDevices}`}
          sub="Online right now"
          color={stats.activeDevices > 0 ? "bg-green-50" : "bg-gray-50"}
        />
        <StatCard
          icon={<Target size={16} className="text-purple-600" />}
          label="Focus Sessions"
          value={stats.focusSessionsToday}
          sub="Completed today"
          color="bg-purple-50"
        />
        <StatCard
          icon={<Shield size={16} className="text-red-600" />}
          label="Blocked Attempts"
          value={stats.blockedAttemptsToday}
          sub="Apps blocked today"
          color="bg-red-50"
        />
      </div>

      {/* ── Main content: devices + alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">

        {/* Device grid — takes 2 cols */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Devices</h2>
            <Link href="/parent/devices"
              className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {devices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <Monitor size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No devices registered yet</p>
              <Link href="/parent/devices" className="text-blue-500 text-sm underline mt-1 inline-block">
                Register a device
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {devices.slice(0, 4).map(device => (
                <DeviceCard key={device.id} device={device} onFocusChange={load} />
              ))}
          </div>
          )}

          {devices.length > 4 && (
            <Link href="/parent/devices"
              className="block text-center text-blue-500 text-sm py-2 bg-white rounded-xl shadow-sm hover:bg-blue-50 transition-colors">
              +{devices.length - 4} more devices →
          </Link>
          )}
        </div>

        {/* Alerts sidebar — 1 col */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Bell size={14} />
              Alerts
              {stats.unreadAlerts > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {stats.unreadAlerts > 9 ? '9+' : stats.unreadAlerts}
            </span>
              )}
            </h2>
            <Link href="/parent/rules"
              className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
              View all <ChevronRight size={12} />
          </Link>
      </div>

          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
            {recentAlerts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-300 text-2xl mb-1">✅</p>
                <p className="text-gray-400 text-xs">No alerts right now</p>
              </div>
            ) : (
              recentAlerts.map(alert => (
                <AlertRow key={alert.id} alert={alert} onMarkRead={handleMarkRead} />
              ))
            )}
            </div>

          {/* Quick links */}
          <div className="space-y-2">
            {[
              { href: '/parent/reports',  icon: '📊', label: 'View Reports' },
              { href: '/parent/control',  icon: '🛡️', label: 'Manage Blocking' },
              { href: '/parent/rules',    icon: '🔔', label: 'Alert Rules' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors">
                <span>{link.icon}</span>
                <span className="text-gray-700 text-sm font-medium">{link.label}</span>
                <ChevronRight size={14} className="text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
