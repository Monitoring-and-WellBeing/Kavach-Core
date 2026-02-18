'use client'
import { useState } from 'react'
import { Search, Shield, Globe, Clock } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockAppUsage } from '@/mock/activity'
import { APP_CATEGORIES } from '@kavach/shared-constants'
import { AppCategory } from '@kavach/shared-types'

const tabs = ['Apps', 'Categories', 'Websites', 'Schedule'] as const

export default function ControlPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Apps')
  const [appSearch, setAppSearch] = useState('')
  const [appBlocks, setAppBlocks] = useState<Record<string, boolean>>({})
  const [appLimits, setAppLimits] = useState<Record<string, number>>({})
  const [categoryBlocks, setCategoryBlocks] = useState<Record<string, boolean>>({
    GAMING: true,
    SOCIAL_MEDIA: true,
    ENTERTAINMENT: false,
  })
  const [blockedSites, setBlockedSites] = useState(['tiktok.com', 'reddit.com'])
  const [newSite, setNewSite] = useState('')
  const { toast, showToast, hideToast } = useToast()

  const filteredApps = mockAppUsage.filter(a =>
    a.appName.toLowerCase().includes(appSearch.toLowerCase())
  )

  const toggleApp = (appName: string) => {
    setAppBlocks(prev => ({ ...prev, [appName]: !prev[appName] }))
    showToast('Rule updated', 'success')
  }

  const toggleCategory = (cat: string) => {
    setCategoryBlocks(prev => ({ ...prev, [cat]: !prev[cat] }))
    showToast('Category rule updated', 'success')
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h2 className="text-gray-900 font-bold text-xl">App & Site Control</h2>
        <p className="text-gray-500 text-sm">Manage app access and web filtering</p>
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

      {/* Apps Tab */}
      {activeTab === 'Apps' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={appSearch}
              onChange={e => setAppSearch(e.target.value)}
              placeholder="Search apps..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            {filteredApps.map(app => (
              <div key={app.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {app.appName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{app.appName}</div>
                    <div className="text-xs text-gray-400">{app.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!appBlocks[app.appName] && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={appLimits[app.appName] || 60}
                        onChange={e => setAppLimits(prev => ({ ...prev, [app.appName]: Number(e.target.value) }))}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                      />
                      <span className="text-xs text-gray-400">min/day</span>
                    </div>
                  )}
                  <button
                    onClick={() => toggleApp(app.appName)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      appBlocks[app.appName] ? 'bg-red-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      appBlocks[app.appName] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'Categories' && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(APP_CATEGORIES).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield size={20} className={categoryBlocks[key] ? 'text-red-500' : 'text-gray-400'} />
                <div>
                  <div className="text-sm font-medium text-gray-800">{label}</div>
                  <div className="text-xs text-gray-400">{categoryBlocks[key] ? 'Blocked' : 'Allowed'}</div>
                </div>
              </div>
              <button
                onClick={() => toggleCategory(key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  categoryBlocks[key] ? 'bg-red-500' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  categoryBlocks[key] ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Websites Tab */}
      {activeTab === 'Websites' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newSite}
              onChange={e => setNewSite(e.target.value)}
              placeholder="Enter domain (e.g. example.com)"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                if (newSite.trim()) {
                  setBlockedSites(prev => [...prev, newSite.trim()])
                  setNewSite('')
                  showToast(`${newSite} blocked`, 'success')
                }
              }}
              className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Block
            </button>
          </div>
          <div className="space-y-2">
            {blockedSites.map(site => (
              <div key={site} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-red-500" />
                  <span className="text-sm font-medium text-gray-700">{site}</span>
                </div>
                <button
                  onClick={() => {
                    setBlockedSites(prev => prev.filter(s => s !== site))
                    showToast(`${site} unblocked`, 'info')
                  }}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'Schedule' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Days</label>
            <div className="flex gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <button key={day} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Start Time</label>
              <input type="time" defaultValue="09:00" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">End Time</label>
              <input type="time" defaultValue="17:00" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          <button
            onClick={() => showToast('Schedule saved!', 'success')}
            className="w-full py-3 rounded-xl text-white font-medium" style={{ background: '#2563EB' }}
          >
            Save Schedule
          </button>
        </div>
      )}
    </div>
  )
}
