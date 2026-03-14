'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Check, School, AlertTriangle, Clock, Users } from 'lucide-react'
import { subscriptionApi, Subscription, Plan } from '@/lib/subscription'
import { useRazorpay } from '@/hooks/useRazorpay'
import { Toast, useToast } from '@/components/ui/Toast'

const FEATURE_LABELS: Record<string, string> = {
  device_monitoring:   '📊 Device monitoring',
  app_blocking:        '🛡️ App & website blocking',
  alerts:              '🔔 Smart alerts',
  focus_mode:          '🎯 Focus mode',
  parent_dashboard:    '📱 Parent dashboard',
  ai_insights:         '🤖 AI insights (Gemini)',
  goals:               '🏹 Goals system',
  achievements:        '🏆 Achievements & badges',
  reports:             '📈 Usage reports & analytics',
  institute_dashboard: '🏫 Institute admin dashboard',
  priority_support:    '⚡ Priority support',
  unlimited_history:   '📂 Unlimited usage history',
}

export default function InstituteSubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const { toast, showToast, hideToast } = useToast()
  const { openCheckout } = useRazorpay()

  useEffect(() => {
    Promise.all([
      subscriptionApi.getCurrent(),
      subscriptionApi.getPlans('B2B'),
    ]).then(([s, p]) => { setSub(s); setPlans(p) })
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (plan: Plan) => {
    setPaying(true)
    try {
      const order = await subscriptionApi.createOrder(plan.code)
      openCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        name: order.planName,
        description: order.description,
        onSuccess: async (rzpData) => {
          try {
            const updated = await subscriptionApi.verifyPayment({
              razorpayOrderId: rzpData.razorpay_order_id,
              razorpayPaymentId: rzpData.razorpay_payment_id,
              razorpaySignature: rzpData.razorpay_signature,
              planCode: plan.code,
            })
            setSub(updated)
            showToast('🎉 Institute plan activated! All 75 device slots are now available.', 'success')
          } catch {
            showToast('Payment received but activation failed. Contact support.', 'error')
          }
        },
        onDismiss: () => showToast('Payment cancelled.', 'error'),
      })
    } catch {
      showToast('Could not initiate payment. Please try again.', 'error')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="h-48 bg-white rounded-2xl shadow-sm" />
      <div className="h-72 bg-white rounded-2xl shadow-sm" />
    </div>
  )

  if (!sub) return null
  const institutePlan = plans[0]  // Only one B2B plan

  return (
    <div className="p-6 space-y-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 className="text-gray-900 font-bold text-xl flex items-center gap-2">
          <CreditCard size={20} className="text-blue-500" /> Institute Subscription
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your institution's plan and device allocation</p>
      </div>

      {/* ── Current plan card ── */}
      <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-sm">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <School size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">{sub.planName} Plan</div>
              <div className="flex items-center gap-2 mt-1">
                {sub.isTrial ? (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Clock size={11} /> Trial — {sub.daysRemaining} days left
                  </span>
                ) : sub.status === 'ACTIVE' ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">✅ Active</span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">{sub.status}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900 text-2xl">{sub.monthlyTotalFormatted}</div>
            <div className="text-gray-400 text-xs">flat monthly</div>
          </div>
        </div>

        {/* Device meter */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-500" />
            <span className="font-medium text-gray-700 text-sm">Device Allocation</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Registered devices</span>
            <span className={`font-bold ${sub.atLimit ? 'text-red-600' : sub.nearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
              {sub.deviceCount} / {sub.maxDevicesLabel}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${
              sub.atLimit ? 'bg-red-500' : sub.nearLimit ? 'bg-amber-500' : 'bg-blue-500'
            }`} style={{ width: `${sub.maxDevices === -1 ? 20 : Math.min(sub.deviceUsagePercent, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>0 devices</span>
            <span>{sub.maxDevicesLabel}</span>
          </div>
        </div>

        {sub.atLimit && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">Device limit reached (75/75). Contact support for a custom plan.</p>
          </div>
        )}
        {sub.nearLimit && !sub.atLimit && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-sm">Approaching device limit ({sub.deviceCount}/75). Contact support for custom pricing if you need more.</p>
          </div>
        )}

        {/* Features grid */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-gray-500 text-xs font-medium mb-3">All included features</p>
          <div className="grid grid-cols-2 gap-1.5">
            {sub.features.map(f => (
              <div key={f} className="flex items-center gap-1.5 text-gray-600 text-xs">
                <Check size={11} className="text-green-500 flex-shrink-0" />
                {FEATURE_LABELS[f] || f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Institute plan CTA ── */}
      {institutePlan && !sub.isTrial && sub.status !== 'ACTIVE' && (
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-bold text-xl">Institute Plan</div>
              <div className="text-blue-100 text-sm mt-1">Everything your school needs</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-3xl">₹3,500</div>
              <div className="text-blue-200 text-xs">/month • up to 75 devices</div>
            </div>
          </div>
          <button
            onClick={() => handleSubscribe(institutePlan)}
            disabled={paying}
            className="w-full py-3 rounded-xl bg-white text-blue-700 font-bold text-sm disabled:opacity-60 transition-all hover:bg-blue-50">
            {paying ? 'Opening payment...' : 'Subscribe — ₹3,500/month'}
          </button>
          <p className="text-blue-200 text-xs mt-3 text-center">
            🔒 Secure payment via Razorpay. Cancel anytime.
          </p>
        </div>
      )}

      {sub.status === 'ACTIVE' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-700 font-medium text-sm">
            ✅ Your institute plan is active. Next renewal: {sub.periodEnd ? new Date(sub.periodEnd).toLocaleDateString('en-IN') : 'N/A'}
          </p>
        </div>
      )}

      <p className="text-gray-400 text-xs text-center">
        Need more than 75 devices? Contact us at support@kavachai.com for custom pricing.
      </p>
    </div>
  )
}
