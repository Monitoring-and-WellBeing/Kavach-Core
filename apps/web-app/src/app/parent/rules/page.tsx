'use client'
import { useState, useEffect, useCallback } from 'react'
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight,
         AlertTriangle, CheckCircle, Info, X, ChevronRight,
         Clock, Monitor, Gamepad2, Moon, Shield } from 'lucide-react'
import { alertsApi, AlertItem, AlertRule, RuleType, Severity } from '@/lib/alerts'
import { devicesApi, Device } from '@/lib/devices'
import { Modal } from '@/components/ui/Modal'
import { Toast, useToast } from '@/components/ui/Toast'

// ── Severity config ────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  CRITICAL: { bg: 'bg-red-50',    border: 'border-red-200',  badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    color: '#ef4444',    icon: <AlertTriangle size={16} className="text-red-500" /> },
  HIGH:     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', color: '#f97316', icon: <AlertTriangle size={16} className="text-orange-500" /> },
  MEDIUM:   { bg: 'bg-amber-50',  border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500',  color: '#f59e0b',  icon: <Info size={16} className="text-amber-500" /> },
  LOW:      { bg: 'bg-blue-50',   border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400',   color: '#60a5fa',   icon: <Info size={16} className="text-blue-400" /> },
}

function getSeverityColor(severity: Severity): string {
  return SEVERITY_CONFIG[severity]?.color || SEVERITY_CONFIG.MEDIUM.color
}

// ── Rule type config ───────────────────────────────────────────────────────────
const RULE_TYPE_CONFIG: Record<RuleType, { label: string; icon: React.ReactNode; description: string }> = {
  SCREEN_TIME_EXCEEDED:    { label: 'Screen Time Limit',     icon: <Clock size={18} />,    description: 'Alert when total daily screen time exceeds a limit' },
  APP_USAGE_EXCEEDED:      { label: 'App Usage Limit',        icon: <Monitor size={18} />,  description: 'Alert when a specific app is used too long' },
  CATEGORY_USAGE_EXCEEDED: { label: 'Category Usage Limit',   icon: <Gamepad2 size={18} />, description: 'Alert when a category (Gaming, Social Media, etc.) exceeds a limit' },
  LATE_NIGHT_USAGE:        { label: 'Late Night Usage',        icon: <Moon size={18} />,     description: 'Alert when device is used after a set time at night' },
  BLOCKED_APP_ATTEMPT:     { label: 'Blocked App Attempt',    icon: <Shield size={18} />,   description: 'Alert when student tries to open a blocked app' },
  FOCUS_MODE_BROKEN:       { label: 'Focus Mode Broken',      icon: <Bell size={18} />,     description: 'Alert when focus mode session is interrupted' },
}

// ── 3-step rule creation wizard ───────────────────────────────────────────────
function CreateRuleWizard({
  onSave, onClose, devices
}: {
  onSave: (rule: any) => Promise<void>
  onClose: () => void
  devices: Device[]
}) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    ruleType: '' as RuleType,
    severity: 'MEDIUM' as Severity,
    appliesTo: 'ALL_DEVICES',
    deviceId: '',
    notifyPush: true,
    notifyEmail: false,
    notifySms: false,
    cooldownMinutes: 60,
    // config fields
    totalMinutes: 240,
    appName: '',
    category: 'GAMING',
    thresholdMinutes: 60,
    startHour: 22,
  })

  const buildConfig = () => {
    switch (form.ruleType) {
      case 'SCREEN_TIME_EXCEEDED':    return { totalMinutes: form.totalMinutes }
      case 'APP_USAGE_EXCEEDED':      return { appName: form.appName, thresholdMinutes: form.thresholdMinutes }
      case 'CATEGORY_USAGE_EXCEEDED': return { category: form.category, thresholdMinutes: form.thresholdMinutes }
      case 'LATE_NIGHT_USAGE':        return { startHour: form.startHour, endHour: 6 }
      default:                        return {}
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        name: form.name || RULE_TYPE_CONFIG[form.ruleType]?.label,
        ruleType: form.ruleType,
        config: buildConfig(),
        severity: form.severity,
        appliesTo: form.appliesTo,
        deviceId: form.appliesTo === 'SPECIFIC_DEVICE' ? form.deviceId : undefined,
        notifyPush: form.notifyPush,
        notifyEmail: form.notifyEmail,
        notifySms: form.notifySms,
        cooldownMinutes: form.cooldownMinutes,
        active: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "text-gray-600 text-xs font-medium block mb-1.5"

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
        {[1,2,3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s === step ? 'text-white' : s < step ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
            }`} style={s === step ? { background: '#2563EB' } : {}}>
              {s < step ? '✓' : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-8 ${s < step ? 'bg-green-500' : 'bg-gray-100'}`} />}
          </div>
        ))}
        <span className="text-gray-400 text-xs ml-2">
          {step === 1 ? 'Choose type' : step === 2 ? 'Configure' : 'Channels'}
        </span>
      </div>

      {/* Step 1 — Choose rule type */}
      {step === 1 && (
        <div className="space-y-2">
          {(Object.entries(RULE_TYPE_CONFIG) as [RuleType, any][]).map(([type, config]) => (
            <button key={type} onClick={() => { setForm(f => ({ ...f, ruleType: type })); setStep(2) }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all hover:border-blue-300 ${
                form.ruleType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
              }`}>
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 flex-shrink-0">
                {config.icon}
              </div>
              <div>
                <div className="font-medium text-gray-800 text-sm">{config.label}</div>
                <div className="text-gray-400 text-xs">{config.description}</div>
              </div>
              <ChevronRight size={16} className="text-gray-300 ml-auto flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — Configure threshold */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Rule Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={RULE_TYPE_CONFIG[form.ruleType]?.label || 'Rule name'}
              className={inputClass} />
          </div>

          {/* Config fields based on type */}
          {form.ruleType === 'SCREEN_TIME_EXCEEDED' && (
            <div>
              <label className={labelClass}>Daily limit (minutes)</label>
              <input type="number" value={form.totalMinutes}
                onChange={e => setForm(f => ({ ...f, totalMinutes: +e.target.value }))}
                min={30} max={720} className={inputClass} />
              <p className="text-gray-400 text-xs mt-1">= {Math.floor(form.totalMinutes/60)}h {form.totalMinutes%60}m</p>
            </div>
          )}

          {form.ruleType === 'APP_USAGE_EXCEEDED' && (
            <>
              <div>
                <label className={labelClass}>App name</label>
                <input value={form.appName} onChange={e => setForm(f => ({ ...f, appName: e.target.value }))}
                  placeholder="e.g. YouTube, Free Fire" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Daily limit (minutes)</label>
                <input type="number" value={form.thresholdMinutes}
                  onChange={e => setForm(f => ({ ...f, thresholdMinutes: +e.target.value }))}
                  min={5} max={480} className={inputClass} />
              </div>
            </>
          )}

          {form.ruleType === 'CATEGORY_USAGE_EXCEEDED' && (
            <>
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className={inputClass}>
                  {['GAMING','SOCIAL_MEDIA','ENTERTAINMENT','COMMUNICATION','OTHER'].map(c => (
                    <option key={c} value={c}>{c.charAt(0)+c.slice(1).toLowerCase().replace('_',' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Daily limit (minutes)</label>
                <input type="number" value={form.thresholdMinutes}
                  onChange={e => setForm(f => ({ ...f, thresholdMinutes: +e.target.value }))}
                  min={10} max={480} className={inputClass} />
              </div>
            </>
          )}

          {form.ruleType === 'LATE_NIGHT_USAGE' && (
            <div>
              <label className={labelClass}>Alert after (hour)</label>
              <select value={form.startHour} onChange={e => setForm(f => ({ ...f, startHour: +e.target.value }))}
                className={inputClass}>
                {[20,21,22,23].map(h => (
                  <option key={h} value={h}>{h}:00 ({h === 22 ? '10 PM' : h === 23 ? '11 PM' : `${h-12} PM`})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as Severity }))}
                className={inputClass}>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Apply to</label>
              <select value={form.appliesTo} onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}
                className={inputClass}>
                <option value="ALL_DEVICES">All devices</option>
                <option value="SPECIFIC_DEVICE">Specific device</option>
              </select>
            </div>
          </div>

          {form.appliesTo === 'SPECIFIC_DEVICE' && (
            <div>
              <label className={labelClass}>Device</label>
              <select value={form.deviceId} onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))}
                className={inputClass}>
                <option value="">Select device...</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: '#2563EB' }}>Next</button>
          </div>
        </div>
      )}

      {/* Step 3 — Notification channels */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">How would you like to be notified when this rule triggers?</p>

          {[
            { key: 'notifyPush', label: 'Push notification', desc: 'In-app notification' },
            { key: 'notifyEmail', label: 'Email', desc: 'Send to your registered email' },
            { key: 'notifySms', label: 'SMS', desc: 'Text message to your phone' },
          ].map(ch => (
            <div key={ch.key} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-700 text-sm">{ch.label}</div>
                <div className="text-gray-400 text-xs">{ch.desc}</div>
              </div>
              <button onClick={() => setForm(f => ({ ...f, [ch.key]: !f[ch.key as keyof typeof f] }))}
                className="transition-colors">
                {(form as any)[ch.key]
                  ? <ToggleRight size={28} className="text-blue-500" />
                  : <ToggleLeft size={28} className="text-gray-300" />}
              </button>
            </div>
          ))}

          <div>
            <label className={labelClass}>Cooldown (minutes between repeated alerts)</label>
            <select value={form.cooldownMinutes}
              onChange={e => setForm(f => ({ ...f, cooldownMinutes: +e.target.value }))}
              className={inputClass}>
              {[30,60,90,120,180,360].map(m => (
                <option key={m} value={m}>{m >= 60 ? `${m/60}h` : `${m}m`}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">Back</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              {saving ? 'Saving...' : 'Create Rule'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlertsRulesPage() {
  const [tab, setTab]         = useState<'alerts' | 'rules'>('alerts')
  const [alerts, setAlerts]   = useState<AlertItem[]>([])
  const [rules, setRules]     = useState<AlertRule[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [unread, setUnread]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)
  const { toast, showToast, hideToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [alertsData, rulesData, devicesData] = await Promise.all([
        alertsApi.getAlerts(),
        alertsApi.getRules(),
        devicesApi.list(),
      ])
      setAlerts(alertsData.alerts)
      setUnread(alertsData.unreadCount)
      setRules(rulesData)
      setDevices(devicesData)
    } catch (err) {
      showToast('Failed to load alerts', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleMarkAllRead = async () => {
    await alertsApi.markAllRead()
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
    setUnread(0)
    showToast('All alerts marked as read')
  }

  const handleDismiss = async (id: string) => {
    await alertsApi.dismiss(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
    showToast('Alert dismissed', 'info')
  }

  const handleMarkRead = async (id: string) => {
    await alertsApi.markRead(id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const handleToggleRule = async (id: string) => {
    const updated = await alertsApi.toggleRule(id)
    setRules(prev => prev.map(r => r.id === id ? updated : r))
    showToast(updated.active ? 'Rule activated' : 'Rule paused')
  }

  const handleDeleteRule = async () => {
    if (!deleteRuleId) return
    await alertsApi.deleteRule(deleteRuleId)
    setRules(prev => prev.filter(r => r.id !== deleteRuleId))
    setDeleteRuleId(null)
    showToast('Rule deleted', 'info')
  }

  const handleCreateRule = async (ruleData: any) => {
    const created = await alertsApi.createRule(ruleData)
    setRules(prev => [...prev, created])
    setCreateOpen(false)
    showToast('Rule created! It will evaluate every 5 minutes.', 'success')
  }

  return (
    <div className="p-4 md:p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-gray-900 font-bold text-lg md:text-xl">Alerts & Rules</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {unread > 0 ? `${unread} unread alert${unread > 1 ? 's' : ''}` : 'No unread alerts'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'alerts' && unread > 0 && (
            <button onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors">
              Mark all read
            </button>
          )}
          {tab === 'rules' && (
            <button onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Plus size={16} /> Create Rule
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4 md:mb-5">
        <button onClick={() => setTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'alerts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Bell size={15} />
          Alerts
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button onClick={() => setTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'rules' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Shield size={15} />
          Rules ({rules.length})
        </button>
      </div>

      {/* ── ALERTS TAB ── */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-24" />
            ))
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle size={48} className="text-green-200 mb-3" />
              <p className="text-gray-500 font-medium">All clear!</p>
              <p className="text-gray-400 text-sm">No alerts right now. Rules are evaluated every 5 minutes.</p>
            </div>
          ) : (
            alerts.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.MEDIUM
              return (
                <div key={alert.id}
                  onClick={() => !alert.read && handleMarkRead(alert.id)}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 transition-all cursor-pointer hover:shadow-md ${!alert.read ? 'ring-1 ring-blue-100' : ''}`}
                  style={{ borderLeftColor: getSeverityColor(alert.severity) }}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                          {alert.severity}
                        </span>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <span className="text-gray-400 text-xs ml-auto">{alert.triggeredAtRelative}</span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{alert.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{alert.message}</p>
                      {alert.deviceName && (
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                          <Monitor size={10} /> {alert.deviceName}
                        </p>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDismiss(alert.id) }}
                      className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 p-1">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── RULES TAB ── */}
      {tab === 'rules' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-20" />
            ))
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Shield size={48} className="text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No rules yet</p>
              <p className="text-gray-400 text-sm">Click "Create Rule" to set up your first alert rule.</p>
            </div>
          ) : (
            rules.map(rule => {
              const typeConfig = RULE_TYPE_CONFIG[rule.ruleType]
              const sevConfig = SEVERITY_CONFIG[rule.severity] || SEVERITY_CONFIG.MEDIUM
              return (
                <div key={rule.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 flex-shrink-0">
                    {typeConfig?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-800 text-sm">{rule.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevConfig.badge}`}>
                        {rule.severity}
                      </span>
                      {!rule.active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs">{typeConfig?.description}</p>
                    {rule.lastTriggered && (
                      <p className="text-gray-300 text-xs mt-0.5">
                        Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleRule(rule.id)} className="transition-colors">
                      {rule.active
                        ? <ToggleRight size={26} className="text-blue-500" />
                        : <ToggleLeft size={26} className="text-gray-300" />}
                    </button>
                    <button onClick={() => setDeleteRuleId(rule.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Create Rule Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Alert Rule" size="md">
        <CreateRuleWizard onSave={handleCreateRule} onClose={() => setCreateOpen(false)} devices={devices} />
      </Modal>

      {/* Delete Rule Confirm */}
      <Modal open={!!deleteRuleId} onClose={() => setDeleteRuleId(null)} title="Delete Rule" size="sm">
        <p className="text-gray-600 text-sm mb-5">This rule and all its history will be permanently deleted.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteRuleId(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm">Cancel</button>
          <button onClick={handleDeleteRule} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
