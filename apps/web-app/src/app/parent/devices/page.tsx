'use client'
import { useState } from 'react'
import { Monitor, Laptop, Plus, RefreshCw, Pause, Play, Trash2,
         Wifi, WifiOff, Clock, Search, X, AlertCircle } from 'lucide-react'
import { useDevices } from '@/hooks/useDevices'
import { Device } from '@/lib/devices'
import { devicesApi } from '@/lib/devices'
import { Modal } from '@/components/ui/Modal'
import { Toast, useToast } from '@/components/ui/Toast'
import { FocusControl } from '@/components/FocusControl'

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Device['status'] }) {
  const config = {
    ONLINE:     { label: 'Online',     bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
    OFFLINE:    { label: 'Offline',    bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
    PAUSED:     { label: 'Paused',     bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
    FOCUS_MODE: { label: 'Focus Mode', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'ONLINE' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  )
}

// ── Device type icon ───────────────────────────────────────────────────────────
function DeviceIcon({ type }: { type: Device['type'] }) {
  return type === 'LAPTOP'
    ? <Laptop size={18} className="text-gray-400" />
    : <Monitor size={18} className="text-gray-400" />
}

// ── Single device card ────────────────────────────────────────────────────────
function DeviceCard({
  device, onPause, onResume, onRemove, onEdit
}: {
  device: Device
  onPause: () => void
  onResume: () => void
  onRemove: () => void
  onEdit: () => void
}) {
  const [actionLoading, setActionLoading] = useState(false)

  const handlePauseResume = async () => {
    setActionLoading(true)
    try {
      device.status === 'PAUSED' ? await onResume() : await onPause()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
            <DeviceIcon type={device.type} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{device.name}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{device.hostname || device.osVersion || 'Unknown OS'}</p>
          </div>
        </div>
        <StatusBadge status={device.status} />
      </div>

      {/* Info rows */}
      <div className="space-y-2 mb-4">
        {device.assignedTo && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            {device.assignedTo}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={11} />
          Last seen: {device.lastSeenRelative}
        </div>
        {device.agentVersion && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Agent v{device.agentVersion}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
        <FocusControl deviceId={device.id} deviceName={device.name} />
        <button onClick={handlePauseResume} disabled={actionLoading || device.status === 'OFFLINE'}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-40">
          {actionLoading ? <RefreshCw size={12} className="animate-spin" /> :
            device.status === 'PAUSED' ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
        </button>
        <button onClick={onEdit}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
          Edit
        </button>
        <button onClick={onRemove}
          className="flex items-center justify-center p-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DevicesPage() {
  const { devices, loading, error, refetch, pause, resume, link, remove } = useDevices()
  const { toast, showToast, hideToast } = useToast()

  // Link modal state
  const [linkOpen, setLinkOpen] = useState(false)
  const [code, setCode] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkStep, setLinkStep] = useState<'form' | 'success'>('form')

  // Edit modal state
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [editName, setEditName] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filter
  const [filter, setFilter] = useState<'ALL' | Device['status']>('ALL')
  const [search, setSearch] = useState('')

  const filtered = devices
    .filter(d => filter === 'ALL' || d.status === filter)
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) ||
                 (d.assignedTo || '').toLowerCase().includes(search.toLowerCase()))

  const counts = {
    ALL: devices.length,
    ONLINE: devices.filter(d => d.status === 'ONLINE').length,
    OFFLINE: devices.filter(d => d.status === 'OFFLINE').length,
    PAUSED: devices.filter(d => d.status === 'PAUSED').length,
    FOCUS_MODE: devices.filter(d => d.status === 'FOCUS_MODE').length,
  }

  const handleLink = async () => {
    if (code.length !== 6) { setLinkError('Code must be exactly 6 characters'); return }
    setLinkLoading(true)
    setLinkError('')
    try {
      await link(code.toUpperCase(), deviceName || undefined, assignedTo || undefined)
      setLinkStep('success')
    } catch (err: any) {
      setLinkError(err.response?.data?.message || 'Invalid or expired code')
    } finally {
      setLinkLoading(false)
    }
  }

  const closeLinkModal = () => {
    setLinkOpen(false)
    setCode(''); setDeviceName(''); setAssignedTo('')
    setLinkError(''); setLinkStep('form')
    if (linkStep === 'success') showToast('Device linked successfully! 🎉')
  }

  const handlePause = async (id: string) => {
    await pause(id); showToast('Device paused')
  }

  const handleResume = async (id: string) => {
    await resume(id); showToast('Device resumed')
  }

  const handleRemove = async () => {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    showToast('Device removed', 'info')
  }

  const openEdit = (d: Device) => {
    setEditDevice(d); setEditName(d.name); setEditAssignedTo(d.assignedTo || '')
  }

  return (
    <div className="p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Devices</h1>
          <p className="text-gray-400 text-sm mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setLinkOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Plus size={16} /> Link New Device
          </button>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['ALL', 'ONLINE', 'OFFLINE', 'PAUSED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devices..."
            className="pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12} /></button>}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-red-600 text-sm">{error}</span>
          <button onClick={refetch} className="ml-auto text-red-500 text-sm underline">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && devices.length === 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="flex gap-3 mb-4"><div className="w-10 h-10 bg-gray-100 rounded-xl" /><div className="flex-1"><div className="h-4 bg-gray-100 rounded mb-2 w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div></div>
              <div className="space-y-2 mb-4"><div className="h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded w-2/3" /></div>
              <div className="h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Device grid */}
      {!loading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Monitor size={48} className="text-gray-200 mb-3" />
          <h3 className="text-gray-500 font-medium">
            {search || filter !== 'ALL' ? 'No matching devices' : 'No devices yet'}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {!search && filter === 'ALL' && 'Click "Link New Device" to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              onPause={() => handlePause(device.id)}
              onResume={() => handleResume(device.id)}
              onRemove={() => setDeleteId(device.id)}
              onEdit={() => openEdit(device)}
            />
          ))}
        </div>
      )}

      {/* ── Link Device Modal ── */}
      <Modal open={linkOpen} onClose={closeLinkModal} title="Link New Device" size="sm">
        {linkStep === 'form' ? (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">Enter the 6-character code shown on the device after installing KAVACH AI agent.</p>

            {/* Code input — large, monospace, uppercase */}
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
          // Success state
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

      {/* ── Edit Device Modal ── */}
      <Modal open={!!editDevice} onClose={() => setEditDevice(null)} title="Edit Device" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Device Name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Assigned To</label>
            <input value={editAssignedTo} onChange={e => setEditAssignedTo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={async () => {
            if (!editDevice) return
            await devicesApi.update(editDevice.id, { name: editName, assignedTo: editAssignedTo })
            setEditDevice(null)
            refetch()
            showToast('Device updated')
          }} className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ background: '#2563EB' }}>
            Save Changes
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Device" size="sm">
        <p className="text-gray-600 text-sm mb-5">Are you sure you want to remove this device? The KAVACH agent will stop syncing and all monitoring will stop.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm hover:bg-gray-200">Cancel</button>
          <button onClick={handleRemove} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600">Remove</button>
        </div>
      </Modal>
    </div>
  )
}
