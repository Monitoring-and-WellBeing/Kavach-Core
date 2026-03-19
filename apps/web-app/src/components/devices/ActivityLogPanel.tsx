'use client'

import { useState, useEffect, useCallback } from 'react'
import { Monitor, RefreshCw, FileText, ShieldOff } from 'lucide-react'
import { activityLogApi, ActivityLogEntry } from '@/lib/activityLog'

interface ActivityLogPanelProps {
  devices: { id: string; name: string }[]
}

const CATEGORY_STYLES: Record<string, string> = {
  EDUCATION:      'bg-blue-100 text-blue-700',
  SOCIAL_MEDIA:   'bg-pink-100 text-pink-700',
  GAMING:         'bg-red-100 text-red-700',
  ENTERTAINMENT:  'bg-purple-100 text-purple-700',
  PRODUCTIVITY:   'bg-green-100 text-green-700',
  COMMUNICATION:  'bg-amber-100 text-amber-700',
  NEWS:           'bg-orange-100 text-orange-700',
  OTHER:          'bg-gray-100 text-gray-600',
}

const HOURS_OPTIONS = [
  { label: 'Last 1 hour',  value: 1  },
  { label: 'Last 6 hours', value: 6  },
  { label: 'Last 24 hours',value: 24 },
  { label: 'Last 7 days',  value: 168 },
]

// Backend stores timestamps as UTC LocalDateTime (no Z suffix).
// Append 'Z' so JS correctly parses as UTC, then display in IST (UTC+5:30).
function toUtcDate(ts: string): Date {
  return new Date(ts.endsWith('Z') ? ts : ts + 'Z')
}

function relativeTime(ts: string): string {
  const diff = Math.floor((Date.now() - toUtcDate(ts).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return toUtcDate(ts).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(ts: string): string {
  return toUtcDate(ts).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function ActivityLogPanel({ devices }: ActivityLogPanelProps) {
  const [logs, setLogs]               = useState<ActivityLogEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedDevice, setDevice]   = useState('all')
  const [hours, setHours]             = useState(24)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await activityLogApi.getLogs(
        selectedDevice !== 'all' ? selectedDevice : undefined,
        hours,
      )
      setLogs(data)
      setLastUpdated(new Date())
    } catch {
      // keep showing stale data on transient errors
    } finally {
      setLoading(false)
    }
  }, [selectedDevice, hours])

  useEffect(() => {
    setLoading(true)
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [load])

  const blockedCount = logs.filter(l => l.blocked).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
            <span className="text-sm font-medium text-gray-700">Screen Activity — refreshes every 30s</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {relativeTime(lastUpdated.toISOString())}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Summary chips */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 font-medium">
            <FileText size={12} /> {logs.length} entries
          </div>
          {blockedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg text-xs text-red-600 font-medium">
              <ShieldOff size={12} /> {blockedCount} blocked
            </div>
          )}

          {/* Time range */}
          <select
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HOURS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Device filter */}
          <select
            value={selectedDevice}
            onChange={e => setDevice(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Devices</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading activity logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">No activity yet in this window</p>
            <p className="text-xs text-gray-400 mt-1">
              Screen activity logs appear here once the desktop agent syncs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">App</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Window / URL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(entry => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-gray-50 transition-colors ${entry.blocked ? 'bg-red-50/40' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      <div>{formatTime(entry.startedAt)}</div>
                      <div className="text-gray-400 text-[10px]">{relativeTime(entry.startedAt)}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-gray-700 text-xs">
                        <Monitor size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{entry.deviceName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900 text-xs">{entry.appName}</div>
                      {entry.processName && (
                        <div className="text-[10px] text-gray-400 font-mono">{entry.processName}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 max-w-[280px]">
                      <span
                        className="text-xs text-gray-600 truncate block"
                        title={entry.windowTitle ?? undefined}
                      >
                        {entry.windowTitle || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${CATEGORY_STYLES[entry.category] ?? CATEGORY_STYLES.OTHER}`}>
                        {entry.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs font-mono whitespace-nowrap">
                      {entry.durationFormatted}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry.blocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full w-fit">
                          <ShieldOff size={9} /> Blocked
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
