'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Pause, Play, Zap, RefreshCw, Plus, Search, Filter } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockDevices } from '@/mock/devices'
import { DeviceStatus } from '@kavach/shared-types'
import { formatMinutes } from '@kavach/shared-utils'

const statusColors: Record<DeviceStatus, string> = {
  ONLINE: 'bg-green-500',
  OFFLINE: 'bg-gray-400',
  PAUSED: 'bg-amber-500',
  FOCUS_MODE: 'bg-blue-500',
}

const statusLabels: Record<DeviceStatus, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  PAUSED: 'Paused',
  FOCUS_MODE: 'Focus Mode',
}

export default function DevicesPage() {
  const router = useRouter()
  const [devices] = useState(mockDevices)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<DeviceStatus | 'ALL'>('ALL')
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [deviceCode, setDeviceCode] = useState('')
  const [focusModalOpen, setFocusModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const { toast, showToast, hideToast } = useToast()

  const filtered = devices.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || (d.assignedTo || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || d.status === filter
    return matchSearch && matchFilter
  })

  const handleSync = (id: string) => {
    setSyncing(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setSyncing(prev => ({ ...prev, [id]: false }))
      showToast('Device synced successfully!', 'success')
    }, 1500)
  }

  const handleLink = () => {
    if (deviceCode.length !== 6) {
      showToast('Enter a valid 6-character device code', 'error')
      return
    }
    setDeviceCode('')
    setLinkModalOpen(false)
    showToast('Device linked successfully! 🎉', 'success')
  }

  const handleFocus = (id: string) => {
    setSelectedDevice(id)
    setFocusModalOpen(true)
  }

  const startFocus = (duration: number) => {
    setFocusModalOpen(false)
    showToast(`Focus mode started for ${duration} minutes`, 'success')
  }

  const getLastSeen = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">Devices</h2>
          <p className="text-gray-500 text-sm">Manage linked devices for Aarav</p>
        </div>
        <button onClick={() => setLinkModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#2563EB' }}>
          <Plus size={16} /> Add Device
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', DeviceStatus.ONLINE, DeviceStatus.OFFLINE, DeviceStatus.PAUSED, DeviceStatus.FOCUS_MODE] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s as DeviceStatus | 'ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              >
                {s === 'ALL' ? 'All' : statusLabels[s as DeviceStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(device => (
          <div key={device.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Monitor size={20} style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{device.name}</div>
                  <div className="text-xs text-gray-400">{device.assignedTo}</div>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${statusColors[device.status]}`} />
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-700">{statusLabels[device.status]}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Screen Time</span>
                <span className="font-medium text-gray-700">{formatMinutes(device.screenTimeToday)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Last Seen</span>
                <span className="font-medium text-gray-700">{getLastSeen(device.lastSeen)}</span>
              </div>
            </div>

            {/* Top Apps */}
            <div className="flex gap-1.5 mb-4">
              {['YouTube', 'Instagram', 'WhatsApp'].map(app => (
                <span key={app} className="px-2 py-0.5 bg-gray-50 rounded-lg text-xs text-gray-600">{app}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/parent/devices/${device.id}`)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-medium text-gray-700 transition-colors"
              >
                <Monitor size={14} /> View
              </button>
              <button
                onClick={() => handleSync(device.id)}
                disabled={syncing[device.id]}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
              >
                {syncing[device.id] ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Syncing
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} /> Sync
                  </>
                )}
              </button>
              <button
                onClick={() => handleFocus(device.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-medium text-gray-700 transition-colors"
              >
                <Zap size={14} /> Focus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Link Device Modal */}
      <Modal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Link New Device">
        <p className="text-gray-500 text-sm mb-4">Enter the 6-character code shown on the device after installing KAVACH AI agent.</p>
        <input
          value={deviceCode}
          onChange={e => setDeviceCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="e.g. KV3X9A"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold text-gray-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <button onClick={handleLink} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: '#2563EB' }}>Link Device</button>
      </Modal>

      {/* Focus Mode Modal */}
      <Modal open={focusModalOpen} onClose={() => setFocusModalOpen(false)} title="Start Focus Mode">
        <div className="space-y-3">
          {[25, 50, 90].map(mins => (
            <button
              key={mins}
              onClick={() => startFocus(mins)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <div className="font-semibold text-gray-800">{mins} minutes</div>
              <div className="text-xs text-gray-400">{mins === 25 ? 'Pomodoro' : mins === 50 ? 'Deep Work' : 'Flow State'}</div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
