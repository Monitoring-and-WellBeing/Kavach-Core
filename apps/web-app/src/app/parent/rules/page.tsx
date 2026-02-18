'use client'
import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, Toast } from '@/components/ui/Toast'
import { mockRules } from '@/mock/rules'
import { Rule, RuleType, RuleStatus } from '@kavach/shared-types'

export default function RulesPage() {
  const [rules, setRules] = useState(mockRules)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [newRule, setNewRule] = useState<Partial<Rule>>({ type: 'APP_LIMIT', status: 'ACTIVE', autoBlock: true })
  const { toast, showToast, hideToast } = useToast()

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } as Rule : r))
    showToast('Rule updated', 'success')
  }

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    setDeleteId(null)
    showToast('Rule deleted', 'info')
  }

  const handleCreate = () => {
    if (!newRule.name || !newRule.target) return
    setRules(prev => [...prev, {
      ...newRule,
      id: `rule-${Date.now()}`,
      tenantId: 'tenant-001',
      createdAt: new Date().toISOString(),
    } as Rule])
    setCreateOpen(false)
    setStep(1)
    setNewRule({ type: 'APP_LIMIT', status: 'ACTIVE', autoBlock: true })
    showToast('Rule created!', 'success')
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-xl">Alerts & Rules</h2>
          <p className="text-gray-500 text-sm">Set up automated rules and view alert history</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#2563EB' }}>
          <Plus size={16} /> Create Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    rule.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rule.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {rule.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Target: {rule.target}</p>
                {rule.limitMinutes && <p className="text-xs text-gray-400 mt-1">Limit: {rule.limitMinutes} min/day</p>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleRule(rule.id)} className="text-gray-400 hover:text-gray-600">
                  {rule.status === 'ACTIVE' ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => setDeleteId(rule.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal - 3 Step Wizard */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setStep(1) }} title={`Create Rule - Step ${step}/3`} size="lg">
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm mb-4">Select rule type</p>
            {(['APP_LIMIT', 'SCHEDULE_BLOCK', 'CATEGORY_BLOCK', 'WEBSITE_BLOCK'] as RuleType[]).map(type => (
              <button
                key={type}
                onClick={() => { setNewRule(prev => ({ ...prev, type })); setStep(2) }}
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="font-semibold text-gray-800">{type.replace('_', ' ')}</div>
                <div className="text-xs text-gray-400 mt-1">Configure {type.toLowerCase()} rules</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rule Name</label>
              <input
                value={newRule.name || ''}
                onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Block Gaming Apps"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Target</label>
              <input
                value={newRule.target || ''}
                onChange={e => setNewRule(prev => ({ ...prev, target: e.target.value }))}
                placeholder={newRule.type === 'APP_LIMIT' ? 'App name' : newRule.type === 'WEBSITE_BLOCK' ? 'Domain' : 'Category'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {newRule.type === 'APP_LIMIT' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Time Limit (minutes)</label>
                <input
                  type="number"
                  value={newRule.limitMinutes || 60}
                  onChange={e => setNewRule(prev => ({ ...prev, limitMinutes: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: '#2563EB' }}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Schedule (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" placeholder="Start" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
                <input type="time" placeholder="End" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50">
                Back
              </button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: '#2563EB' }}>
                Save Rule
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Rule">
        <p className="text-gray-600 text-sm mb-4">Are you sure you want to delete this rule? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
