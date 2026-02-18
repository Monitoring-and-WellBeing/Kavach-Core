'use client'
import { useState } from 'react'
import { User, Users, Shield, Bell, Save, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockStudents } from '@/mock/students'

const tabs = ['Profile', 'Children', 'Notifications', 'Privacy'] as const

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Profile')
  const [profile, setProfile] = useState({ name: 'Meena Singh', email: 'meena.singh@gmail.com', phone: '+91 98765 43210' })
  const [notifications, setNotifications] = useState({
    push: true, email: true, sms: false,
    lateNight: true, usageSpike: true, blockedAttempt: true, limitReached: false,
  })
  const [privacy, setPrivacy] = useState({
    shareData: true, analytics: true, marketing: false,
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const handleSave = () => {
    showToast('Settings saved successfully!', 'success')
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h2 className="text-gray-900 font-bold text-xl">Settings</h2>
        <p className="text-gray-500 text-sm">Manage your account and preferences</p>
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

      {/* Profile Tab */}
      {activeTab === 'Profile' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
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
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: '#2563EB' }}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Children Tab */}
      {activeTab === 'Children' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">Child Profiles</h3>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#2563EB' }}>
              <Users size={16} /> + Add Child
            </button>
          </div>
          {mockStudents.map(student => (
            <div key={student.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">Age {student.age} · Class {student.grade}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.deviceIds.map((_, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">Device {i + 1}</span>
                  ))}
                  <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
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

      {/* Privacy Tab */}
      {activeTab === 'Privacy' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
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
