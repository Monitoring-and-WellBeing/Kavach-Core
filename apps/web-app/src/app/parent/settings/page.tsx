'use client'
import { useState, useEffect } from 'react'
import { User, Users, Shield, Bell, Save, Trash2, Camera, Info, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, Toast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { devicesApi, Device } from '@/lib/devices'
import { api } from '@/lib/axios'

const tabs = ['Profile', 'Children', 'Notifications', 'Screenshots', 'Privacy'] as const

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Profile')
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [devices, setDevices] = useState<Device[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [saving, setSaving] = useState(false)

  // Pre-fill profile from auth context
  useEffect(() => {
    if (user) {
      setProfile({ name: user.name ?? '', email: user.email ?? '', phone: (user as any).phone ?? '' })
    }
  }, [user])

  // Load devices when Children tab is active
  useEffect(() => {
    if (activeTab === 'Children') {
      setLoadingDevices(true)
      devicesApi.list()
        .then(setDevices)
        .catch(() => {})
        .finally(() => setLoadingDevices(false))
    }
  }, [activeTab])

  const [notifications, setNotifications] = useState({
    push: true, email: true, sms: false,
    lateNight: true, usageSpike: true, blockedAttempt: true, limitReached: false,
  })
  const [privacy, setPrivacy] = useState({
    shareData: true, analytics: true, marketing: false,
  })
  const [screenshots, setScreenshots] = useState({
    enabled: false,
    violationEnabled: true,
    periodicEnabled: false,
    periodicIntervalMin: 5,
    schoolHoursOnly: true,
    schoolStart: '08:00',
    schoolEnd: '16:00',
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await api.put(`/users/${user.id}`, { name: profile.name, phone: profile.phone || undefined })
      showToast('Settings saved successfully!', 'success')
    } catch {
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h2 className="text-gray-900 font-bold text-lg md:text-xl">Settings</h2>
        <p className="text-gray-500 text-sm">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'Profile' && (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Parent Information</h3>
          </div>
          <div className="space-y-4 max-w-md">
            {[
              { key: 'name', label: 'Full Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{field.label}</label>
                <input
                  value={profile[field.key as keyof typeof profile]}
                  onChange={e => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50" style={{ background: '#2563EB' }}>
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Children Tab */}
      {activeTab === 'Children' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">Linked Devices</h3>
            </div>
          </div>
          {loadingDevices ? (
            <div className="flex items-center text-gray-400 text-sm py-4">
              <RefreshCw size={16} className="animate-spin mr-2" /> Loading devices...
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl shadow-sm">
              No devices linked yet. Go to the Devices page to link a device.
            </div>
          ) : (
            devices.map(device => (
              <div key={device.id} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 flex-shrink-0 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {(device.assignedTo || device.name).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{device.assignedTo || device.name}</div>
                      <div className="text-sm text-gray-500">{device.type} · {device.osVersion ?? 'Unknown OS'}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                      device.status === 'ONLINE' ? 'bg-green-100 text-green-700' :
                      device.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                      device.status === 'FOCUS_MODE' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{device.status}</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                      {Math.round(device.screenTimeToday / 60)}m today
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Channels</p>
              {[
                { key: 'push', label: 'Push Notifications' },
                { key: 'email', label: 'Email Alerts' },
                { key: 'sms', label: 'SMS Alerts' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      notifications[item.key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Alert Types</p>
              {[
                { key: 'lateNight', label: 'Late Night Usage' },
                { key: 'usageSpike', label: 'Usage Spike' },
                { key: 'blockedAttempt', label: 'Blocked Attempt' },
                { key: 'limitReached', label: 'Limit Reached' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      notifications[item.key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Active rules will trigger notifications through your selected channels. SMS alerts require a verified phone number.</p>
          </div>
        </div>
      )}

      {/* Screenshots Tab */}
      {activeTab === 'Screenshots' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 space-y-1">
              <p className="font-semibold">Screenshot Monitoring is opt-in</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Screenshots are <strong>OFF by default</strong>. When enabled, students see a
                disclosure notice on their next login. All screenshots auto-delete after 7 days.
                Signed URLs expire in 1 hour — they cannot be shared permanently.
              </p>
            </div>
          </div>

          {/* Master toggle */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Camera size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">Screenshot Monitoring</h3>
            </div>

            {/* Master enable */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable Screenshot Monitoring</p>
                <p className="text-xs text-gray-500 mt-0.5">Master switch — students will be notified</p>
              </div>
              <button
                onClick={() => setScreenshots(p => ({ ...p, enabled: !p.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  screenshots.enabled ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  screenshots.enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Options — only shown when enabled */}
            {screenshots.enabled && (
              <div className="space-y-3 pl-1">
                {/* Violation capture */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Capture on Rule Violation</p>
                    <p className="text-xs text-gray-400">Screenshot taken when a blocked app is detected</p>
                  </div>
                  <button
                    onClick={() => setScreenshots(p => ({ ...p, violationEnabled: !p.violationEnabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      screenshots.violationEnabled ? 'bg-red-400' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      screenshots.violationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Periodic capture */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Periodic Snapshots</p>
                    <p className="text-xs text-gray-400">Capture every N minutes during school hours</p>
                  </div>
                  <button
                    onClick={() => setScreenshots(p => ({ ...p, periodicEnabled: !p.periodicEnabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      screenshots.periodicEnabled ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      screenshots.periodicEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Interval slider — shown only when periodic is on */}
                {screenshots.periodicEnabled && (
                  <div className="p-3 rounded-xl border border-gray-100 space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                      Capture Interval:{' '}
                      <span className="text-blue-600 font-semibold">
                        every {screenshots.periodicIntervalMin} min
                      </span>
                    </p>
                    <input
                      type="range"
                      min={5} max={30} step={5}
                      value={screenshots.periodicIntervalMin}
                      onChange={e => setScreenshots(p => ({ ...p, periodicIntervalMin: Number(e.target.value) }))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>5 min</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30 min</span>
                    </div>
                  </div>
                )}

                {/* School hours only */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">School Hours Only</p>
                    <p className="text-xs text-gray-400">Only capture during school day window</p>
                  </div>
                  <button
                    onClick={() => setScreenshots(p => ({ ...p, schoolHoursOnly: !p.schoolHoursOnly }))}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      screenshots.schoolHoursOnly ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      screenshots.schoolHoursOnly ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Time window */}
                {screenshots.schoolHoursOnly && (
                  <div className="p-3 rounded-xl border border-gray-100 space-y-3">
                    <p className="text-sm font-medium text-gray-800">School Hours Window</p>
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Start</label>
                        <input
                          type="time"
                          value={screenshots.schoolStart}
                          onChange={e => setScreenshots(p => ({ ...p, schoolStart: e.target.value }))}
                          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <span className="text-gray-300 mt-4">→</span>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">End</label>
                        <input
                          type="time"
                          value={screenshots.schoolEnd}
                          onChange={e => setScreenshots(p => ({ ...p, schoolEnd: e.target.value }))}
                          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Retention notice */}
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                  <Shield size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Screenshots auto-delete after <strong>7 days</strong>. Viewing links expire in 1 hour.
                    Students see a disclosure notice the first time monitoring is active.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={() => showToast('Screenshot settings saved!', 'success')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: '#2563EB' }}
          >
            <Save size={16} /> Save Screenshot Settings
          </button>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'Privacy' && (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Consent & Privacy</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: 'shareData', label: 'Share usage data for AI insights', desc: 'Allows our AI to analyze patterns and provide recommendations' },
              { key: 'analytics', label: 'Anonymous analytics', desc: 'Help improve KAVACH AI with anonymized usage stats' },
              { key: 'marketing', label: 'Marketing emails', desc: 'Receive product updates and tips' },
            ].map(item => (
              <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
                <button
                  onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof privacy] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    privacy[item.key as keyof typeof privacy] ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    privacy[item.key as keyof typeof privacy] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} /> Request data deletion
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Request Data Deletion">
        <p className="text-gray-600 text-sm mb-4">Are you sure you want to request data deletion? This action cannot be undone and will take up to 30 days to process.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => {
              setDeleteConfirmOpen(false)
              showToast('Data deletion requested. We\'ll process your request within 30 days.', 'info')
            }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600"
          >
            Confirm Deletion
          </button>
        </div>
      </Modal>
    </div>
  )
}
