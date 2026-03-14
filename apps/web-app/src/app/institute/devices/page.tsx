'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Pause, Play, Zap, RefreshCw, Plus, AlertCircle } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { instituteDashboardApi, InstituteDevice } from '@/lib/instituteDashboard'
import { devicesApi } from '@/lib/devices'
import { formatMinutes, formatTime } from '@kavach/shared-utils'
import { DeviceStatus } from '@kavach/shared-types'

const statusColors: Record<DeviceStatus, string> = {
  ONLINE:     'bg-green-100 text-green-700',
  OFFLINE:    'bg-gray-100 text-gray-700',
  PAUSED:     'bg-amber-100 text-amber-700',
  FOCUS_MODE: 'bg-blue-100 text-blue-700',
}

export default function InstituteDevicesPage() {
  const [devices, setDevices]   = useState<InstituteDevice[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actioning, setActioning] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [code, setCode] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkStep, setLinkStep] = useState<'form' | 'success'>('form')
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleLink = async () => {
    if (code.length !== 6) {
      setLinkError('Code must be exactly 6 characters')
      return
    }
    setLinkLoading(true)
    setLinkError('')
    try {
      await devicesApi.link(code.toUpperCase(), deviceName || undefined, assignedTo || undefined)
      setLinkStep('success')
      showToast('Device linked successfully!', 'success')
    } catch (err: any) {
      setLinkError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Invalid or expired code. Please try again.'
      )
    } finally {
      setLinkLoading(false)
    }
  }

  const closeLinkModal = () => {
    setLinkOpen(false)
    setCode('')
    setDeviceName('')
    setAssignedTo('')
    setLinkError('')
    setLinkStep('form')
    load()
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">All Devices</h2>
          <p className="text-gray-500 text-sm">Manage all lab devices</p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
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
          <button onClick={() => setLinkOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Plus size={16} /> Link New Device
          </button>
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
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
                      {devices.length === 0
                        ? 'No devices registered. Click "Link New Device" to register a device.'
                        : 'No matching devices'}
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

      {/* Link New Device Modal */}
      <Modal open={linkOpen} onClose={closeLinkModal} title="Link New Device" size="sm">
        {linkStep === 'form' ? (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">Enter the 6-character code shown on the device after installing KAVACH AI agent.</p>

            <div>
              <label className="text-gray-600 text-xs font-medium block mb-1.5">Device Code</label>
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setLinkError('') }}
                maxLength={6}
                placeholder="KV3X9A"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold text-gray-800 tracking-[0.3em] focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-gray-400 text-xs mt-1 text-center">Code expires in 15 minutes</p>
            </div>

            <div>
              <label className="text-gray-600 text-xs font-medium block mb-1.5">Device Name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={deviceName} onChange={e => setDeviceName(e.target.value)} placeholder="e.g. Lab PC — Row A1"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="text-gray-600 text-xs font-medium block mb-1.5">Assigned To <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="e.g. Rahul Sharma"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {linkError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-red-600 text-sm">{linkError}</span>
              </div>
            )}

            <button onClick={handleLink} disabled={linkLoading || code.length !== 6}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              {linkLoading ? 'Linking...' : 'Link Device'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-2">Device Linked!</h3>
            <p className="text-gray-500 text-sm mb-6">The device will appear as Online once the KAVACH agent starts sending heartbeats.</p>
            <button onClick={closeLinkModal} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: '#2563EB' }}>Done</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
