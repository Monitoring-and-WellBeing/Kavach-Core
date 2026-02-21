'use client'
import { useState, useEffect, useCallback } from 'react'
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight,
         Monitor, Gamepad2, Instagram, Globe, Search,
         Clock, X, AlertCircle, ChevronRight } from 'lucide-react'
import { blockingApi, BlockRule } from '@/lib/blocking'
import { devicesApi, Device } from '@/lib/devices'
import { Modal } from '@/components/ui/Modal'
import { Toast, useToast } from '@/components/ui/Toast'

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'GAMING',        label: 'Gaming',        icon: '🎮', color: 'bg-red-100 text-red-700' },
  { value: 'SOCIAL_MEDIA',  label: 'Social Media',  icon: '📱', color: 'bg-purple-100 text-purple-700' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬', color: 'bg-amber-100 text-amber-700' },
  { value: 'COMMUNICATION', label: 'Communication', icon: '💬', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'NEWS',          label: 'News',          icon: '📰', color: 'bg-gray-100 text-gray-700' },
]

// Common apps for quick-add
const QUICK_ADD_APPS = [
  { name: 'Free Fire',  process: 'freefire.exe',  category: 'GAMING' },
  { name: 'PUBG',       process: 'pubg.exe',       category: 'GAMING' },
  { name: 'Valorant',   process: 'valorant.exe',  category: 'GAMING' },
  { name: 'Roblox',     process: 'robloxplayerbeta.exe', category: 'GAMING' },
  { name: 'Instagram',  process: 'instagram.exe', category: 'SOCIAL_MEDIA' },
  { name: 'WhatsApp',   process: 'whatsapp.exe',  category: 'COMMUNICATION' },
  { name: 'Discord',    process: 'discord.exe',   category: 'COMMUNICATION' },
  { name: 'Spotify',    process: 'spotify.exe',   category: 'ENTERTAINMENT' },
]

type Tab = 'apps' | 'categories' | 'schedule'

function RuleTypeBadge({ type }: { type: BlockRule['ruleType'] }) {
  const config = {
    APP:      { label: 'App',      color: 'bg-blue-100 text-blue-700' },
    CATEGORY: { label: 'Category', color: 'bg-purple-100 text-purple-700' },
    WEBSITE:  { label: 'Website',  color: 'bg-green-100 text-green-700' },
    KEYWORD:  { label: 'Keyword',  color: 'bg-amber-100 text-amber-700' },
  }[type]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export default function AppControlPage() {
  const [tab, setTab] = useState<Tab>('apps')
  const [rules, setRules] = useState<BlockRule[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast, showToast, hideToast } = useToast()

  // Create form state
  const [form, setForm] = useState({
    name: '', ruleType: 'APP' as BlockRule['ruleType'],
    target: '', appliesTo: 'ALL_DEVICES' as BlockRule['appliesTo'], deviceId: '',
    scheduleEnabled: false, scheduleDays: 'MON,TUE,WED,THU,FRI,SAT,SUN',
    scheduleStart: '09:00', scheduleEnd: '17:00',
    showMessage: true, blockMessage: 'This app has been blocked.',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesData, devicesData] = await Promise.all([
        blockingApi.getRules(),
        devicesApi.list(),
      ])
      setRules(rulesData)
      setDevices(devicesData)
    } catch { showToast('Failed to load block rules', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      const created = await blockingApi.createRule({ ...form, active: true })
      setRules(prev => [created, ...prev])
      setCreateOpen(false)
      setForm(f => ({ ...f, name: '', target: '' }))
      showToast('Block rule created. Agent will enforce in ~60 seconds.', 'success')
    } catch { showToast('Failed to create rule', 'error') }
  }

  const handleQuickAdd = async (app: typeof QUICK_ADD_APPS[0]) => {
    try {
      const created = await blockingApi.createRule({
        name: `Block ${app.name}`, ruleType: 'APP', target: app.process,
        appliesTo: 'ALL_DEVICES', scheduleEnabled: false,
        scheduleDays: 'MON,TUE,WED,THU,FRI,SAT,SUN',
        showMessage: true, blockMessage: `${app.name} has been blocked.`, active: true,
      })
      setRules(prev => [created, ...prev])
      showToast(`${app.name} blocked on all devices`)
    } catch { showToast('Failed to add block rule', 'error') }
  }

  const handleToggle = async (id: string) => {
    const updated = await blockingApi.toggleRule(id)
    setRules(prev => prev.map(r => r.id === id ? updated : r))
    showToast(updated.active ? 'Rule activated' : 'Rule paused')
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await blockingApi.deleteRule(deleteId)
    setRules(prev => prev.filter(r => r.id !== deleteId))
    setDeleteId(null)
    showToast('Rule deleted', 'info')
  }

  const handleCategoryToggle = async (category: string) => {
    const existing = rules.find(r => r.ruleType === 'CATEGORY' && r.target === category)
    if (existing) {
      const updated = await blockingApi.toggleRule(existing.id)
      setRules(prev => prev.map(r => r.id === existing.id ? updated : r))
      showToast(updated.active ? `${category} blocked` : `${category} unblocked`)
    } else {
      const created = await blockingApi.createRule({
        name: `Block ${category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ')}`,
        ruleType: 'CATEGORY', target: category, appliesTo: 'ALL_DEVICES',
        scheduleEnabled: false, scheduleDays: 'MON,TUE,WED,THU,FRI,SAT,SUN',
        showMessage: true, blockMessage: `This category has been blocked.`, active: true,
      })
      setRules(prev => [created, ...prev])
      showToast(`${category} category blocked on all devices`)
    }
  }

  const isCategoryBlocked = (category: string) =>
    rules.some(r => r.ruleType === 'CATEGORY' && r.target === category && r.active)

  const appRules = rules.filter(r => r.ruleType === 'APP' || r.ruleType === 'KEYWORD')
  const filteredRules = appRules.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.target.toLowerCase().includes(search.toLowerCase())
  )

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="p-4 md:p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
      <div>
          <h1 className="text-gray-900 font-bold text-lg md:text-xl">App & Site Control</h1>
          <p className="text-gray-400 text-sm mt-0.5">{rules.filter(r => r.active).length} active block rules</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <Plus size={16} /> Add Block Rule
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4 md:mb-5 overflow-x-auto scrollbar-hide">
        {([['apps','Apps'], ['categories','Categories'], ['schedule','Schedule']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── APPS TAB ── */}
      {tab === 'apps' && (
        <div className="space-y-5">
          {/* Quick-add common apps */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Quick Block Common Apps</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
              {QUICK_ADD_APPS.map(app => {
                const alreadyBlocked = rules.some(r => r.target === app.process && r.active)
                return (
                  <button key={app.process} onClick={() => !alreadyBlocked && handleQuickAdd(app)}
                    disabled={alreadyBlocked}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      alreadyBlocked
                        ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                    <div className="font-medium text-gray-700 text-xs">{app.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5 truncate">{app.process}</div>
                    {alreadyBlocked && <div className="text-red-500 text-xs mt-1 font-medium">Blocked</div>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search + rules list */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search block rules..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="py-16 text-center">
                <Shield size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No app block rules yet</p>
                <p className="text-gray-300 text-xs">Use "Quick Block" above or "Add Block Rule"</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{rule.name}</span>
                        <RuleTypeBadge type={rule.ruleType} />
                        {!rule.active && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Paused</span>}
                        {rule.scheduleEnabled && (
                          <span className="text-xs text-blue-500 flex items-center gap-1">
                            <Clock size={10} /> {rule.scheduleStart}–{rule.scheduleEnd}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{rule.target}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleToggle(rule.id)}>
                        {rule.active
                          ? <ToggleRight size={26} className="text-blue-500" />
                          : <ToggleLeft size={26} className="text-gray-300" />}
                      </button>
                      <button onClick={() => setDeleteId(rule.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CATEGORIES TAB ── */}
      {tab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {CATEGORIES.map(cat => {
            const blocked = isCategoryBlocked(cat.value)
            return (
              <div key={cat.value} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${blocked ? 'border-red-200' : 'border-transparent'}`}>
                <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                <div>
                      <div className="font-semibold text-gray-800 text-sm">{cat.label}</div>
                      <div className={`text-xs font-medium mt-0.5 ${blocked ? 'text-red-500' : 'text-gray-400'}`}>
                        {blocked ? 'Blocked' : 'Allowed'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleCategoryToggle(cat.value)}>
                    {blocked
                      ? <ToggleRight size={28} className="text-red-500" />
                      : <ToggleLeft size={28} className="text-gray-300" />}
                  </button>
                </div>
                <p className="text-gray-400 text-xs">
                  {blocked ? 'All apps in this category are blocked on all devices.' : 'Apps in this category are allowed.'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SCHEDULE TAB ── */}
      {tab === 'schedule' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">Scheduled Block Rules</h3>
          <p className="text-gray-400 text-sm mb-5">Rules with time-based schedules</p>
          {rules.filter(r => r.scheduleEnabled).length === 0 ? (
            <div className="py-16 text-center">
              <Clock size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No scheduled rules yet</p>
              <p className="text-gray-300 text-xs mt-1">Create a rule and enable scheduling to block apps during specific hours</p>
              <button onClick={() => { setTab('apps'); setCreateOpen(true) }}
                className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: '#2563EB' }}>
                Create Scheduled Rule
            </button>
          </div>
          ) : (
            <div className="space-y-3">
              {rules.filter(r => r.scheduleEnabled).map(rule => (
                <div key={rule.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Clock size={16} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{rule.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {rule.scheduleDays?.split(',').join(', ')} · {rule.scheduleStart} – {rule.scheduleEnd}
                    </div>
                  </div>
                  <button onClick={() => handleToggle(rule.id)}>
                    {rule.active
                      ? <ToggleRight size={26} className="text-blue-500" />
                      : <ToggleLeft size={26} className="text-gray-300" />}
                  </button>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* ── Create Rule Modal ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Block Rule" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Rule Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Block Instagram" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-600 text-xs font-medium block mb-1.5">Block Type</label>
              <select value={form.ruleType} onChange={e => setForm(f => ({ ...f, ruleType: e.target.value as BlockRule['ruleType'] }))}
                className={inputClass}>
                <option value="APP">App (by process name)</option>
                <option value="CATEGORY">Category</option>
                <option value="KEYWORD">Window title keyword</option>
              </select>
            </div>
            <div>
              <label className="text-gray-600 text-xs font-medium block mb-1.5">
                {form.ruleType === 'APP' ? 'Process Name' : form.ruleType === 'CATEGORY' ? 'Category' : 'Keyword'}
              </label>
              {form.ruleType === 'CATEGORY' ? (
                <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className={inputClass}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              ) : (
                <input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  placeholder={form.ruleType === 'APP' ? 'e.g. freefire.exe' : 'e.g. YouTube'}
                  className={inputClass} />
              )}
            </div>
          </div>

          {/* Schedule toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <div className="font-medium text-gray-700 text-sm">Enable Schedule</div>
              <div className="text-gray-400 text-xs">Only block during specific hours</div>
            </div>
            <button onClick={() => setForm(f => ({ ...f, scheduleEnabled: !f.scheduleEnabled }))}>
              {form.scheduleEnabled
                ? <ToggleRight size={28} className="text-blue-500" />
                : <ToggleLeft size={28} className="text-gray-300" />}
            </button>
          </div>

          {form.scheduleEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-600 text-xs font-medium block mb-1.5">Start Time</label>
                <input type="time" value={form.scheduleStart}
                  onChange={e => setForm(f => ({ ...f, scheduleStart: e.target.value }))}
                  className={inputClass} />
            </div>
            <div>
                <label className="text-gray-600 text-xs font-medium block mb-1.5">End Time</label>
                <input type="time" value={form.scheduleEnd}
                  onChange={e => setForm(f => ({ ...f, scheduleEnd: e.target.value }))}
                  className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Block Message (shown to student)</label>
            <input value={form.blockMessage} onChange={e => setForm(f => ({ ...f, blockMessage: e.target.value }))}
              className={inputClass} />
          </div>

          <button onClick={handleCreate} disabled={!form.name || !form.target}
            className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            Create Block Rule
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Block Rule" size="sm">
        <p className="text-gray-600 text-sm mb-5">This rule will be permanently deleted. The app will no longer be blocked.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm">Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
