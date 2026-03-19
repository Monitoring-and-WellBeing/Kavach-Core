'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Pause, Play, Zap, RefreshCw, Plus, Activity, ScrollText } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { instituteDashboardApi, InstituteDevice } from '@/lib/instituteDashboard'
import { devicesApi, Device } from '@/lib/devices'
import { formatTime } from '@kavach/shared-utils'
import { DeviceStatus } from '@kavach/shared-types'
import { DeviceLinkModal } from '@/components/devices/DeviceLinkModal'
import { LiveMonitorPanel } from '@/components/devices/LiveMonitorPanel'
import { ActivityLogPanel } from '@/components/devices/ActivityLogPanel'

const statusColors: Record<DeviceStatus, string> = {
  ONLINE:     'bg-green-100 text-green-700',
  OFFLINE:    'bg-gray-100 text-gray-700',
  PAUSED:     'bg-amber-100 text-amber-700',
  FOCUS_MODE: 'bg-blue-100 text-blue-700',
}

type Tab = 'devices' | 'monitor' | 'activity'

export default function InstituteDevicesPage() {
  const [devices, setDevices]   = useState<InstituteDevice[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actioning, setActioning] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('devices')
  const { toast, showToast, hideToast } = useToast()

  const load = useCallback(async () => {
    try {
      const dash = await instituteDashboardApi.get()
      setDevices(dash.devices)
    } catch {
      showToast('Failed to load devices', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.assignedTo || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(d => d.id)))
  }

  const handleBulkAction = async (action: 'PAUSE' | 'RESUME' | 'FOCUS') => {
    if (selected.size === 0) return
    setActioning(true)
    try {
      await instituteDashboardApi.bulkAction(action, Array.from(selected))
      const label = action === 'PAUSE' ? 'paused' : action === 'RESUME' ? 'resumed' : 'set to focus mode'
      showToast(`${selected.size} device(s) ${label}`, 'success')
      setSelected(new Set())
      await load()
    } catch {
      showToast(`Failed to apply ${action.toLowerCase()} action`, 'error')
    } finally {
      setActioning(false)
    }
  }

  const handlePauseDevice = async (id: string) => {
    try {
      await devicesApi.pause(id)
      showToast('Device paused', 'success')
      await load()
    } catch {
      showToast('Failed to pause device', 'error')
    }
  }

  const handleResumeDevice = async (id: string) => {
    try {
      await devicesApi.resume(id)
      showToast('Device resumed', 'success')
      await load()
    } catch {
      showToast('Failed to resume device', 'error')
    }
  }

  const handleFocusDevice = async (id: string) => {
    try {
      await instituteDashboardApi.bulkAction('FOCUS', [id])
      showToast('Focus mode enabled', 'success')
      await load()
    } catch {
      showToast('Failed to enable focus mode', 'error')
    }
  }

  const handleExportCSV = () => {
    const rows = [
      ['Device', 'Student', 'Status', 'Screen Time', 'Violations', 'Last Seen'],
      ...filtered.map(d => [
        d.name,
        d.assignedTo || '',
        d.status,
        d.screenTimeFormatted,
        String(d.blockedAttempts),
        d.lastSeen ? new Date(d.lastSeen).toLocaleString() : '',
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `devices-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV downloaded!', 'success')
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <DeviceLinkModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onLinked={(_device: Device) => {
          setLinkModalOpen(false)
          setLoading(true)
          load()
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">Devices</h2>
          <p className="text-gray-500 text-sm">Manage and monitor all lab devices</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'devices' && selected.size > 0 && (
            <>
              <button onClick={() => handleBulkAction('PAUSE')} disabled={actioning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {actioning ? <RefreshCw size={16} className="animate-spin" /> : <Pause size={16} />}
                Pause {selected.size} Selected
              </button>
              <button onClick={() => handleBulkAction('FOCUS')} disabled={actioning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
                <Zap size={16} /> Force Focus
              </button>
            </>
          )}
          <button onClick={() => setLinkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Add Device
          </button>
          {activeTab === 'devices' && (
            <button onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'devices'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Devices
          <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-semibold">
            {devices.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'monitor'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity size={14} />
          Live Monitor
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'activity'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ScrollText size={14} />
          Activity Log
        </button>
      </div>

      {/* Live Monitor Tab */}
      {activeTab === 'monitor' && (
        <LiveMonitorPanel
          devices={devices.map(d => ({ id: d.id, name: d.name }))}
        />
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <ActivityLogPanel
          devices={devices.map(d => ({ id: d.id, name: d.name }))}
        />
      )}

      {/* Devices Tab — Search + Table */}
      {activeTab === 'devices' && <>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search devices or students..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2" /> Loading devices...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screen Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {devices.length === 0 ? 'No devices registered' : 'No matching devices'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(device => (
                    <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox"
                          checked={selected.has(device.id)}
                          onChange={() => toggleSelect(device.id)}
                          className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{device.name}</div>
                        <div className="text-xs text-gray-400">{device.osVersion}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{device.assignedTo || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[device.status as DeviceStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{device.screenTimeFormatted}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${device.blockedAttempts > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                          {device.blockedAttempts}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {device.lastSeen ? formatTime(device.lastSeen) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {device.status === 'PAUSED' ? (
                            <button onClick={() => handleResumeDevice(device.id)}
                              className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1">
                              <Play size={12} /> Resume
                            </button>
                          ) : (
                            <button onClick={() => handlePauseDevice(device.id)}
                              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              Pause
                            </button>
                          )}
                          {device.status !== 'FOCUS_MODE' && (
                            <button onClick={() => handleFocusDevice(device.id)}
                              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              Focus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>}
    </div>
  )
}
