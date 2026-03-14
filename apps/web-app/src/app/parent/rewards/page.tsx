'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Gift, Plus, ToggleLeft, ToggleRight, CheckCircle, XCircle,
  PartyPopper, Clock, ChevronDown,
} from 'lucide-react'
import {
  rewardsApi, Reward, Redemption, RewardCategory,
  REWARD_SUGGESTIONS, CATEGORY_LABELS, STATUS_CONFIG,
} from '@/lib/rewards'
import { Modal } from '@/components/ui/Modal'
import { Toast, useToast } from '@/components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryBadge(category: RewardCategory) {
  const colors: Record<RewardCategory, string> = {
    SCREEN_TIME: 'bg-blue-100 text-blue-700',
    OUTING:      'bg-green-100 text-green-700',
    FOOD_TREAT:  'bg-orange-100 text-orange-700',
    PURCHASE:    'bg-purple-100 text-purple-700',
    PRIVILEGE:   'bg-pink-100 text-pink-700',
    CUSTOM:      'bg-gray-100 text-gray-600',
  }
  return colors[category] ?? 'bg-gray-100 text-gray-600'
}

// ── Reward catalog card ───────────────────────────────────────────────────────

function RewardCard({
  reward,
  onToggle,
}: {
  reward: Reward
  onToggle: (id: string) => void
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
        reward.active ? 'border-transparent' : 'border-dashed border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
          {reward.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{reward.title}</p>
              {reward.description && (
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{reward.description}</p>
              )}
            </div>
            <button
              onClick={() => onToggle(reward.id)}
              className={`flex-shrink-0 transition-colors ${
                reward.active ? 'text-blue-500 hover:text-blue-700' : 'text-gray-300 hover:text-gray-500'
              }`}
              title={reward.active ? 'Disable reward' : 'Enable reward'}
            >
              {reward.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryBadge(reward.category)}`}>
              {CATEGORY_LABELS[reward.category]}
            </span>
            <span className="text-blue-600 font-bold text-sm">{reward.xpCost} XP</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Redemption request card ───────────────────────────────────────────────────

function RedemptionCard({
  redemption,
  onApprove,
  onDeny,
  onFulfill,
}: {
  redemption: Redemption
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  onFulfill: (id: string) => void
}) {
  const [showDenyNote, setShowDenyNote] = useState(false)
  const [denyNote, setDenyNote] = useState('')
  const cfg = STATUS_CONFIG[redemption.status]

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl leading-none">{redemption.reward?.icon ?? '🎁'}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">
            <span className="text-blue-600">{redemption.studentName}</span> wants:{' '}
            {redemption.reward?.title}
          </p>
          <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
            <Clock size={10} />
            {redemption.requestedAtRelative}
          </p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Student note */}
      {redemption.studentNote && (
        <div className="bg-blue-50 rounded-xl px-3 py-2 mb-3">
          <p className="text-blue-700 text-xs italic">"{redemption.studentNote}"</p>
        </div>
      )}

      {/* XP cost */}
      <p className="text-gray-500 text-xs mb-3">
        XP to deduct:{' '}
        <span className="font-bold text-blue-600">{redemption.xpSpent} XP</span>
      </p>

      {/* Actions */}
      {redemption.status === 'PENDING' && (
        <>
          {showDenyNote ? (
            <div className="space-y-2">
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Reason for denying (optional)..."
                value={denyNote}
                onChange={e => setDenyNote(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDenyNote(false); setDenyNote('') }}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDeny(redemption.id)}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Confirm Deny
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDenyNote(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <XCircle size={14} /> Deny
              </button>
              <button
                onClick={() => onApprove(redemption.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-sm font-medium transition-colors"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
              >
                <CheckCircle size={14} /> Approve
              </button>
            </div>
          )}
        </>
      )}

      {redemption.status === 'APPROVED' && (
        <button
          onClick={() => onFulfill(redemption.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-sm font-medium transition-colors"
          style={{ background: '#7C3AED' }}
        >
          <PartyPopper size={14} /> Mark as Fulfilled (reward given!)
        </button>
      )}

      {redemption.parentNote && (
        <p className="text-gray-400 text-xs mt-2 italic">Your note: "{redemption.parentNote}"</p>
      )}
    </div>
  )
}

// ── Create reward modal ───────────────────────────────────────────────────────

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'CUSTOM' as RewardCategory,
  xpCost: 300,
  icon: '🎁',
}

function CreateRewardModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (form: typeof INITIAL_FORM) => Promise<void>
}) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim() || form.xpCost < 1) return
    setSaving(true)
    try {
      await onCreate(form)
      setForm(INITIAL_FORM)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <Modal open={open} onClose={onClose} title="Create Reward" size="md">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-gray-600 text-xs font-medium block mb-1.5">Title *</label>
          <input
            className={inputClass}
            placeholder="e.g. Pizza night"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-gray-600 text-xs font-medium block mb-1.5">Category</label>
          <div className="relative">
            <select
              className={inputClass + ' appearance-none pr-8'}
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as RewardCategory }))}
            >
              {(Object.entries(CATEGORY_LABELS) as [RewardCategory, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-gray-600 text-xs font-medium block mb-1.5">Description</label>
          <input
            className={inputClass}
            placeholder="Brief description of the reward..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* Icon + XP Cost */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">Icon (emoji)</label>
            <input
              className={inputClass + ' text-center text-xl'}
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              maxLength={4}
              placeholder="🎁"
            />
          </div>
          <div>
            <label className="text-gray-600 text-xs font-medium block mb-1.5">XP Cost *</label>
            <input
              type="number"
              className={inputClass}
              value={form.xpCost}
              onChange={e => setForm(f => ({ ...f, xpCost: Number(e.target.value) }))}
              min={1}
              max={9999}
            />
          </div>
        </div>

        {/* Predefined suggestions */}
        <div>
          <label className="text-gray-600 text-xs font-medium block mb-2">
            Quick suggestions (click to prefill)
          </label>
          <div className="flex flex-wrap gap-2">
            {REWARD_SUGGESTIONS.map(s => (
              <button
                key={s.title}
                onClick={() =>
                  setForm({
                    title: s.title,
                    description: s.description,
                    category: s.category,
                    xpCost: s.xpCost,
                    icon: s.icon,
                  })
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {s.icon} {s.title} · {s.xpCost} XP
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || form.xpCost < 1 || saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            {saving ? 'Creating...' : 'Create Reward'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [pending, setPending] = useState<Redemption[]>([])
  const [resolved, setResolved] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rw, pd] = await Promise.all([
        rewardsApi.getAll(),
        rewardsApi.getPending(),
      ])
      setRewards(rw)
      setPending(pd)
    } catch {
      showToast('Failed to load rewards data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id: string) => {
    try {
      const updated = await rewardsApi.toggle(id)
      setRewards(prev => prev.map(r => r.id === id ? updated : r))
      showToast(updated.active ? 'Reward enabled' : 'Reward disabled', 'info')
    } catch {
      showToast('Failed to update reward', 'error')
    }
  }

  const handleCreate = async (form: typeof INITIAL_FORM) => {
    const created = await rewardsApi.create(form)
    setRewards(prev => [created, ...prev])
    setCreateOpen(false)
    showToast('Reward created! 🎁', 'success')
  }

  const handleApprove = async (id: string) => {
    try {
      const updated = await rewardsApi.resolve(id, 'APPROVED')
      setPending(prev => prev.filter(r => r.id !== id))
      setResolved(prev => [updated, ...prev])
      showToast('Reward approved! ✅', 'success')
    } catch {
      showToast('Failed to approve', 'error')
    }
  }

  const handleDeny = async (id: string) => {
    try {
      const updated = await rewardsApi.resolve(id, 'DENIED')
      setPending(prev => prev.filter(r => r.id !== id))
      setResolved(prev => [updated, ...prev])
      showToast('Request denied', 'info')
    } catch {
      showToast('Failed to deny', 'error')
    }
  }

  const handleFulfill = async (id: string) => {
    try {
      const updated = await rewardsApi.fulfill(id)
      setResolved(prev => prev.map(r => r.id === id ? updated : r))
      showToast('Reward fulfilled! 🎉', 'success')
    } catch {
      showToast('Failed to update', 'error')
    }
  }

  const activeCount = rewards.filter(r => r.active).length

  return (
    <div className="p-4 md:p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-bold text-lg md:text-xl flex items-center gap-2">
            <Gift size={20} className="text-blue-500" /> Rewards
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {activeCount} active reward{activeCount !== 1 ? 's' : ''} ·{' '}
            {pending.length} pending request{pending.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          <Plus size={16} /> Add Reward
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Reward Catalog ── */}
        <div>
          <h2 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
            🏪 Reward Catalog
            <span className="text-gray-400 font-normal">({rewards.length})</span>
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white rounded-2xl shadow-sm" />
              ))}
            </div>
          ) : rewards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm text-center">
              <Gift size={40} className="text-gray-200 mb-3" />
              <h3 className="text-gray-500 font-semibold text-sm">No rewards yet</h3>
              <p className="text-gray-400 text-xs mt-1 mb-4">
                Create rewards your child can redeem with earned XP
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                className="px-4 py-2 rounded-xl text-white text-xs font-medium"
                style={{ background: '#2563EB' }}
              >
                Create First Reward
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map(r => (
                <RewardCard key={r.id} reward={r} onToggle={handleToggle} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Pending Requests ── */}
        <div>
          <h2 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
            ⏳ Pending Requests
            {pending.length > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {pending.length} new
              </span>
            )}
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map(i => <div key={i} className="h-36 bg-white rounded-2xl shadow-sm" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm text-center">
              <CheckCircle size={40} className="text-gray-200 mb-3" />
              <h3 className="text-gray-500 font-semibold text-sm">All caught up!</h3>
              <p className="text-gray-400 text-xs mt-1">
                No pending reward requests from your child
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(r => (
                <RedemptionCard
                  key={r.id}
                  redemption={r}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onFulfill={handleFulfill}
                />
              ))}
            </div>
          )}

          {/* Recently resolved */}
          {resolved.length > 0 && (
            <div className="mt-4">
              <h3 className="text-gray-500 font-semibold text-xs mb-2 uppercase tracking-wide">
                Recently Resolved
              </h3>
              <div className="space-y-2">
                {resolved.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.reward?.icon ?? '🎁'}</span>
                      <div>
                        <p className="text-gray-700 text-xs font-semibold">{r.reward?.title}</p>
                        <p className="text-gray-400 text-xs">{r.studentName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handleFulfill(r.id)}
                          className="text-xs px-2.5 py-1 rounded-lg text-white font-medium"
                          style={{ background: '#7C3AED' }}
                        >
                          Mark Fulfilled
                        </button>
                      )}
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: STATUS_CONFIG[r.status].bg,
                          color: STATUS_CONFIG[r.status].color,
                        }}
                      >
                        {STATUS_CONFIG[r.status].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create modal ── */}
      <CreateRewardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
