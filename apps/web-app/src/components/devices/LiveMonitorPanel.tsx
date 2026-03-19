'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, RefreshCw, Monitor } from 'lucide-react'
import { monitoringApi, MonitoringEvent } from '@/lib/monitoring'

interface LiveMonitorPanelProps {
  devices: { id: string; name: string }[]
}

const ACTION_STYLES: Record<string, string> = {
  BLOCKED:             'bg-red-100 text-red-700',
  APP_BLOCKED:         'bg-red-100 text-red-700',
  URL_BLOCKED:         'bg-orange-100 text-orange-700',
  KILL_TOOL_DETECTED:  'bg-red-900/30 text-red-400',
  OVERLAY_SHOWN:       'bg-amber-100 text-amber-700',
  FOCUS_VIOLATION:     'bg-blue-100 text-blue-700',
  TIME_LIMIT_REACHED:  'bg-purple-100 text-purple-700',
}

function relativeTime(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return new Date(ts).toLocaleTimeString()
}

export function LiveMonitorPanel({ devices }: LiveMonitorPanelProps) {
  const [events, setEvents]           = useState<MonitoringEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedDevice, setSelected] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await monitoringApi.getEvents(
        selectedDevice !== 'all' ? selectedDevice : undefined
      )
      setEvents(data)
      setLastUpdated(new Date())
    } catch {
      // keep showing stale events on transient errors
    } finally {
      setLoading(false)
    }
  }, [selectedDevice])

  useEffect(() => {
    setLoading(true)
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [load])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-sm font-medium text-gray-700">Live — auto-refreshes every 5s</span>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {relativeTime(lastUpdated.toISOString())}
            </span>
          )}
        </div>
        <select
          value={selectedDevice}
          onChange={e => setSelected(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Devices</option>
          {devices.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Log terminal */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 h-[460px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <RefreshCw size={14} className="animate-spin mr-2" /> Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <Activity size={28} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No enforcement events yet</p>
            <p className="text-xs text-gray-700 mt-1">
              Events appear here when the desktop agent blocks an app or URL.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-gray-500 font-medium">Time</th>
                <th className="px-4 py-2 text-left text-gray-500 font-medium">Action</th>
                <th className="px-4 py-2 text-left text-gray-500 font-medium w-32">Device</th>
                <th className="px-4 py-2 text-left text-gray-500 font-medium">App / Process</th>
                <th className="px-4 py-2 text-left text-gray-500 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {events.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {relativeTime(ev.timestamp)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${ACTION_STYLES[ev.action] ?? 'bg-gray-700 text-gray-300'}`}>
                      {ev.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-300 truncate max-w-[8rem]">
                    <span className="flex items-center gap-1">
                      <Monitor size={10} className="text-gray-600 flex-shrink-0" />
                      {ev.deviceName}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-blue-400">{ev.processName}</td>
                  <td className="px-4 py-2 text-gray-500 truncate max-w-[12rem]">
                    {ev.detail ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
