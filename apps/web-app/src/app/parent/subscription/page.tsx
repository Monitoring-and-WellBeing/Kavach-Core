'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Check, Zap, Shield, AlertTriangle, Clock } from 'lucide-react'
import { subscriptionApi, Subscription, Plan } from '@/lib/subscription'
import { useRazorpay } from '@/hooks/useRazorpay'
import { Toast, useToast } from '@/components/ui/Toast'

const PLAN_ICONS: Record<string, React.ReactNode> = {
  BASIC:    <Shield size={20} className="text-gray-500" />,
  STANDARD: <Zap size={20} className="text-blue-500" />,
}

const PLAN_COLORS: Record<string, string> = {
  BASIC:    'border-gray-200 bg-gray-50',
  STANDARD: 'border-blue-200 bg-blue-50',
}

const FEATURE_LABELS: Record<string, string> = {
  device_monitoring:   '📊 Device monitoring',
  app_blocking:        '🛡️ App & site blocking',
  alerts:              '🔔 Smart alerts',
  focus_mode:          '🎯 Focus mode',
  parent_dashboard:    '📱 Parent dashboard',
  ai_insights:         '🤖 AI insights (Gemini)',
  goals:               '🏹 Goals system',
  achievements:        '🏆 Achievements & badges',
  reports:             '📈 Usage reports',
}

function StatusBadge({ sub }: { sub: Subscription }) {
  if (sub.isTrial) return (
    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
      <Clock size={11} /> Trial — {sub.daysRemaining} days left
    </span>
  )
  if (sub.status === 'ACTIVE') return (
    <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
      ✅ Active
    </span>
  )
  return (
    <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
      {sub.status}
    </span>
  )
}

export default function ParentSubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const { toast, showToast, hideToast } = useToast()
  const { openCheckout } = useRazorpay()

  useEffect(() => {
    Promise.all([
      subscriptionApi.getCurrent(),
      subscriptionApi.getPlans('B2C'),
    ]).then(([s, p]) => { setSub(s); setPlans(p) })
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (plan: Plan) => {
    setPaying(plan.code)
    try {
      // Step 1: Create Razorpay order on backend
      const order = await subscriptionApi.createOrder(plan.code)

      // Step 2: Open Razorpay checkout modal
      openCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        name: order.planName,
        description: order.description,
        onSuccess: async (rzpData) => {
          try {
            // Step 3: Verify signature + activate on backend
            const updated = await subscriptionApi.verifyPayment({
              razorpayOrderId: rzpData.razorpay_order_id,
              razorpayPaymentId: rzpData.razorpay_payment_id,
              razorpaySignature: rzpData.razorpay_signature,
              planCode: plan.code,
            })
            setSub(updated)
            setPlans(prev => prev.map(p => ({ ...p, current: p.code === plan.code })))
            showToast(`🎉 Upgraded to ${plan.name}! Payment successful.`, 'success')
          } catch {
            showToast('Payment received but activation failed. Contact support.', 'error')
          }
        },
        onDismiss: () => {
          showToast('Payment cancelled.', 'error')
          setPaying(null)
        },
      })
    } catch {
      showToast('Could not initiate payment. Please try again.', 'error')
    } finally {
      setPaying(null)
    }
  }

  if (loading) return (
    <div className="p-4 md:p-6 animate-pulse space-y-4">
      <div className="h-40 bg-white rounded-2xl shadow-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {[1, 2].map(i => <div key={i} className="h-80 bg-white rounded-2xl shadow-sm" />)}
      </div>
    </div>
  )

  if (!sub) return null

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 className="text-gray-900 font-bold text-lg md:text-xl flex items-center gap-2">
          <CreditCard size={20} className="text-blue-500" /> Subscription
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your plan and device limits</p>
      </div>

      {/* ── Current plan card ── */}
      <div className={`rounded-2xl p-4 md:p-5 border-2 ${PLAN_COLORS[sub.planCode] || 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {PLAN_ICONS[sub.planCode]}
            <div>
              <div className="font-bold text-gray-900 text-lg">{sub.planName} Plan</div>
              <StatusBadge sub={sub} />
            </div>
          </div>
          <div className="sm:text-right">
            <div className="font-bold text-gray-900 text-xl">{sub.monthlyTotalFormatted}</div>
            <div className="text-gray-400 text-xs">flat monthly billing</div>
          </div>
        </div>

        {/* Device usage meter */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600 font-medium">Devices</span>
            <span className={`font-semibold ${sub.atLimit ? 'text-red-600' : sub.nearLimit ? 'text-amber-600' : 'text-gray-700'}`}>
              {sub.deviceCount} / {sub.maxDevicesLabel}
            </span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${
              sub.atLimit ? 'bg-red-500' : sub.nearLimit ? 'bg-amber-500' : 'bg-blue-500'
            }`} style={{ width: `${sub.maxDevices === -1 ? 30 : Math.min(sub.deviceUsagePercent, 100)}%` }} />
          </div>
        </div>

        {sub.atLimit && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">Device limit reached. Upgrade to Standard (4 devices) to add more.</p>
          </div>
        )}
        {sub.nearLimit && !sub.atLimit && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-sm">Approaching your device limit. Consider upgrading soon.</p>
          </div>
        )}
        {sub.isTrial && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
            <Clock size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-blue-700 text-sm">
              Trial ends in <strong>{sub.daysRemaining} days</strong>. Subscribe to keep full access.
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/50">
          <p className="text-gray-500 text-xs font-medium mb-2">Included features</p>
          <div className="grid grid-cols-2 gap-1">
            {sub.features.map(f => (
              <div key={f} className="flex items-center gap-1.5 text-gray-600 text-xs">
                <Check size={11} className="text-green-500 flex-shrink-0" />
                {FEATURE_LABELS[f] || f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Plan comparison ── */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 md:mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {plans.map(plan => (
            <div key={plan.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${
                plan.current ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {PLAN_ICONS[plan.code]}
                  <span className="font-bold text-gray-900">{plan.name}</span>
                </div>
                {plan.current && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                )}
              </div>

              <div className="text-3xl font-bold text-gray-900 mt-3">
                {plan.priceFormatted.split('/')[0]}
              </div>
              <div className="text-gray-400 text-xs mb-1">/month (flat)</div>
              <div className="text-gray-500 text-sm mb-4 font-medium">{plan.maxDevicesLabel}</div>

              <div className="space-y-1.5 mb-5">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-gray-600 text-xs">
                    <Check size={12} className="text-green-500 flex-shrink-0" />
                    {FEATURE_LABELS[f] || f}
                  </div>
                ))}
              </div>

              {plan.current ? (
                <div className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium text-center">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={paying === plan.code}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-blue-600 to-violet-600 disabled:opacity-60 transition-all">
                  {paying === plan.code ? 'Opening payment...' :
                   sub.planCode === 'STANDARD' && plan.code === 'BASIC' ? 'Downgrade to Basic' :
                   `Upgrade to ${plan.name} — ${plan.priceFormatted.split('/')[0]}/mo`}
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3 text-center">
          🔒 Payments are processed securely via Razorpay. Kavach AI does not store card details.
        </p>
      </div>
    </div>
  )
}
