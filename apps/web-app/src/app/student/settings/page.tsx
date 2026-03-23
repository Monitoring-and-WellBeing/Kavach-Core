'use client'
import { useState, useEffect } from 'react'
import { Save, Bell, Music, RefreshCw } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'

export default function StudentSettings() {
  const { user } = useAuth()
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [pushNotif, setPushNotif]   = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [focusSound, setFocusSound] = useState(true)
  const [soundType, setSoundType]   = useState('rain')
  const [saving, setSaving]         = useState(false)
  const { toast, showToast, hideToast } = useToast()

  // Pre-fill from auth context
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone ?? '')
    }
  }, [user])

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await api.put(`/users/${user.id}`, { name, phone: phone || undefined })
      showToast('Settings saved successfully!', 'success')
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ on, toggle }: { on: boolean; toggle: () => void }) => (
    <button onClick={toggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-purple-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )

  return (
    <div className="p-6 space-y-6 fade-up max-w-2xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Profile */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Email</label>
            <input type="email" value={email} readOnly
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin to update.</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Push Notifications</div>
              <div className="text-xs text-gray-400">Get alerts on your device</div>
            </div>
            <Toggle on={pushNotif} toggle={() => setPushNotif(v => !v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Email Notifications</div>
              <div className="text-xs text-gray-400">Receive updates via email</div>
            </div>
            <Toggle on={emailNotif} toggle={() => setEmailNotif(v => !v)} />
          </div>
        </div>
      </div>

      {/* Focus Sounds */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Music size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">Focus Sounds</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Enable Background Sounds</div>
              <div className="text-xs text-gray-400">Play ambient sounds during focus sessions</div>
            </div>
            <Toggle on={focusSound} toggle={() => setFocusSound(v => !v)} />
          </div>
          {focusSound && (
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">Sound Type</label>
              <select value={soundType} onChange={e => setSoundType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="rain">Rain</option>
                <option value="ocean">Ocean Waves</option>
                <option value="forest">Forest</option>
                <option value="white-noise">White Noise</option>
                <option value="cafe">Cafe</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
