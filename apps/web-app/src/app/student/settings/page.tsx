'use client'
import { useState } from 'react'
import { Save, Bell, Music } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'

export default function StudentSettings() {
  const [name, setName] = useState('Rahul Sharma')
  const [email, setEmail] = useState('student@demo.com')
  const [pushNotif, setPushNotif] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [focusSound, setFocusSound] = useState(true)
  const [soundType, setSoundType] = useState('rain')
  const { toast, showToast, hideToast } = useToast()

  const handleSave = () => {
    showToast('Settings saved successfully!', 'success')
  }

  return (
    <div className="p-6 space-y-6 fade-up max-w-2xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Profile Tab */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: '#7C3AED' }}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* Notifications Tab */}
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
            <button
              onClick={() => setPushNotif(!pushNotif)}
              className={`relative w-11 h-6 rounded-full transition-colors ${pushNotif ? 'bg-purple-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${pushNotif ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Email Notifications</div>
              <div className="text-xs text-gray-400">Receive updates via email</div>
            </div>
            <button
              onClick={() => setEmailNotif(!emailNotif)}
              className={`relative w-11 h-6 rounded-full transition-colors ${emailNotif ? 'bg-purple-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${emailNotif ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Focus Sounds Tab */}
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
            <button
              onClick={() => setFocusSound(!focusSound)}
              className={`relative w-11 h-6 rounded-full transition-colors ${focusSound ? 'bg-purple-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${focusSound ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {focusSound && (
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">Sound Type</label>
              <select
                value={soundType}
                onChange={e => setSoundType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
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
