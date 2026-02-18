'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Monitor, Clock, Shield, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockDevices } from '@/mock/devices'
import { mockAppUsage, mockWeeklyData } from '@/mock/activity'
import { mockRules } from '@/mock/rules'
import { mockAlerts } from '@/mock/alerts'
import { formatMinutes } from '@kavach/shared-utils'

const tabs = ['Overview', 'App Usage', 'Websites', 'Rules', 'Alerts'] as const

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview')
  const { toast, showToast, hideToast } = useToast()

  const device = mockDevices.find(d => d.id === id)
  if (!device) {
    return (
      <div className="p-6 text-center text-gray-500">Device not found</div>
    )
  }

  const deviceApps = mockAppUsage.filter(a => a.deviceId === device.id)
  const deviceAlerts = mockAlerts.filter(a => a.deviceId === device.id)
  const deviceRules = mockRules.filter(r => !r.deviceId || r.deviceId === device.id)

  const topApps = deviceApps
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, 5)
    .map(app => ({ name: app.appName, minutes: app.durationMinutes, color: '#3B82F6' }))

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <button onClick={() => router.push('/parent/devices')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft size={18} /> Back to Devices
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">{device.name}</h2>
          <p className="text-gray-500 text-sm">{device.assignedTo} · {device.osVersion}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            device.status === 'ONLINE' ? 'bg-green-100 text-green-700' :
            device.status === 'OFFLINE' ? 'bg-gray-100 text-gray-700' :
            device.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {device.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Clock size={20} style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Screen Time Today</div>
                  <div className="text-gray-900 text-xl font-bold">{formatMinutes(device.screenTimeToday)}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F0FDF4' }}>
                  <Monitor size={20} style={{ color: '#22C55E' }} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Top App</div>
                  <div className="text-gray-900 text-xl font-bold">{topApps[0]?.name || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFF7ED' }}>
                  <Shield size={20} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Active Rules</div>
                  <div className="text-gray-900 text-xl font-bold">{deviceRules.filter(r => r.status === 'ACTIVE').length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Hourly Usage Timeline</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockWeeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Bar dataKey="screenTime" radius={[6, 6, 0, 0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'App Usage' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Top Apps</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topApps} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} width={100} />
              <Bar dataKey="minutes" radius={[0, 6, 6, 0]}>
                {topApps.map((app, i) => <Cell key={i} fill={app.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'Websites' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Website Activity</h3>
          <div className="space-y-2">
            {[
              { domain: 'youtube.com', time: 45, blocked: false },
              { domain: 'instagram.com', time: 30, blocked: true },
              { domain: 'github.com', time: 60, blocked: false },
            ].map((site, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">{site.domain}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{site.time} min</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    site.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {site.blocked ? 'Blocked' : 'Allowed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Rules' && (
        <div className="space-y-3">
          {deviceRules.map(rule => (
            <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{rule.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{rule.type.replace('_', ' ')}</div>
                </div>
                <button className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rule.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {rule.status}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Alerts' && (
        <div className="space-y-3">
          {deviceAlerts.map(alert => (
            <div key={alert.id} className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{alert.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleString()}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  alert.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
