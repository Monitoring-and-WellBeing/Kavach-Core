'use client'
import { Monitor, Users, Bell, Shield, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { mockDevices } from '@/mock/devices'
import { mockCategoryBreakdown } from '@/mock/activity'
import { mockAlerts } from '@/mock/alerts'
import { DeviceStatus } from '@kavach/shared-types'

const statusColors: Record<DeviceStatus, string> = {
  ONLINE: '#22C55E',
  OFFLINE: '#6B7280',
  PAUSED: '#F59E0B',
  FOCUS_MODE: '#3B82F6',
}

const categoryColors: Record<string, string> = {
  Education: '#3B82F6',
  Gaming: '#EF4444',
  Entertainment: '#F59E0B',
  'Social Media': '#8B5CF6',
  Productivity: '#22C55E',
  Other: '#6B7280',
}

export default function InstituteDashboard() {
  const totalDevices = mockDevices.length
  const onlineDevices = mockDevices.filter(d => d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.FOCUS_MODE).length
  const alertsToday = mockAlerts.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length
  const complianceScore = 78

  const criticalAlerts = mockAlerts.filter(a => a.severity === 'HIGH').slice(0, 5)

  // Generate device heatmap
  const deviceGrid = Array.from({ length: 48 }, () => {
    const statuses: DeviceStatus[] = [
      DeviceStatus.ONLINE,
      DeviceStatus.ONLINE,
      DeviceStatus.ONLINE,
      DeviceStatus.FOCUS_MODE,
      DeviceStatus.OFFLINE,
      DeviceStatus.PAUSED,
    ]
    return statuses[Math.floor(Math.random() * statuses.length)]
  })

  return (
    <div className="p-6 space-y-5 fade-up">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
              <Monitor size={20} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Total Devices</div>
              <div className="text-gray-900 text-2xl font-bold">{totalDevices}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F0FDF4' }}>
              <Monitor size={20} style={{ color: '#22C55E' }} />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Online Now</div>
              <div className="text-gray-900 text-2xl font-bold">{onlineDevices}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}>
              <Bell size={20} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Alerts Today</div>
              <div className="text-gray-900 text-2xl font-bold">{alertsToday}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F5F3FF' }}>
              <Shield size={20} style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Compliance Score</div>
              <div className="text-gray-900 text-2xl font-bold">{complianceScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Device Status Heatmap */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Lab Device Status</h3>
          <div className="grid grid-cols-8 gap-1.5 mb-4">
            {deviceGrid.map((status, i) => (
              <div
                key={i}
                title={`PC ${i + 1} — ${status}`}
                className="w-6 h-6 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: statusColors[status] }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                <span className="text-xs text-gray-500 capitalize">{status.toLowerCase().replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Institute-wide App Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={mockCategoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {mockCategoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="font-semibold text-gray-900">Critical Alerts</h3>
        </div>
        <div className="space-y-3">
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="flex items-start justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">{alert.message}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
