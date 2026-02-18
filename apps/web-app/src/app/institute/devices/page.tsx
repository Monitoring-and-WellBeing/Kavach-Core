'use client'
import { useState } from 'react'
import { Search, Download, Pause, Play, Zap } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockDevices } from '@/mock/devices'
import { formatMinutes, formatTime } from '@kavach/shared-utils'
import { DeviceStatus } from '@kavach/shared-types'

const statusColors: Record<DeviceStatus, string> = {
  ONLINE: 'bg-green-100 text-green-700',
  OFFLINE: 'bg-gray-100 text-gray-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  FOCUS_MODE: 'bg-blue-100 text-blue-700',
}

export default function InstituteDevicesPage() {
  const [devices] = useState(mockDevices)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { toast, showToast, hideToast } = useToast()

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
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(d => d.id)))
    }
  }

  const handleBulkPause = () => {
    showToast(`${selected.size} device(s) paused`, 'success')
    setSelected(new Set())
  }

  const handleBulkFocus = () => {
    showToast(`Focus mode applied to ${selected.size} device(s)`, 'success')
    setSelected(new Set())
  }

  const handleExportCSV = () => {
    showToast('CSV exported!', 'success')
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
              <button onClick={handleBulkPause} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
                <Pause size={16} /> Pause {selected.size} Selected
              </button>
              <button onClick={handleBulkFocus} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600">
                <Zap size={16} /> Force Focus
              </button>
            </>
          )}
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search devices or students..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
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
              {filtered.map(device => (
                <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(device.id)}
                      onChange={() => toggleSelect(device.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{device.name}</div>
                    <div className="text-xs text-gray-400">{device.osVersion}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{device.assignedTo || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[device.status]}`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatMinutes(device.screenTimeToday)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">0</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatTime(device.lastSeen)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                        Pause
                      </button>
                      <button className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                        Focus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
