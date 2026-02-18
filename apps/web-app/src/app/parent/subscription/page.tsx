'use client'
import { useState } from 'react'
import { Check, CreditCard, Smartphone } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, Toast } from '@/components/ui/Toast'
import { PlanType } from '@kavach/shared-types'
import { PLAN_LIMITS } from '@kavach/shared-constants'

const plans = [
  { type: PlanType.STARTER, name: 'Starter', monthly: 100, annual: 80, devices: 50 },
  { type: PlanType.INSTITUTE, name: 'Institute', monthly: 150, annual: 120, devices: 300 },
  { type: PlanType.ENTERPRISE, name: 'Enterprise', monthly: 0, annual: 0, devices: 'Unlimited' },
]

export default function SubscriptionPage() {
  const [billing, setBilling] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [payMethod, setPayMethod] = useState<'card' | 'upi'>('card')
  const [paySuccess, setPaySuccess] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const currentPlan = PlanType.STARTER
  const devicesUsed = 1
  const deviceLimit = 5

  const handleUpgrade = (plan: PlanType) => {
    setSelectedPlan(plan)
    setPaymentOpen(true)
    setPaySuccess(false)
  }

  const handlePayment = () => {
    setTimeout(() => {
      setPaySuccess(true)
      showToast('Plan upgraded successfully!', 'success')
    }, 1500)
  }

  return (
    <div className="p-6 space-y-5 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h2 className="text-gray-900 font-bold text-xl">Choose Your Plan</h2>
        <p className="text-gray-500 text-sm">Protect your child's digital wellbeing</p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-amber-900">Current Plan: Free Trial</div>
          <div className="text-sm text-amber-700">3 days remaining - upgrade to keep all features</div>
        </div>
        <button className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">
          Trial Expires Soon
        </button>
      </div>

      {/* Usage Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Device Usage</span>
          <span className="text-sm font-semibold text-gray-800">{devicesUsed} of {deviceLimit} devices used (Free Trial)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(devicesUsed / deviceLimit) * 100}%` }} />
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['MONTHLY', 'ANNUAL'] as const).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                billing === b ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {b === 'MONTHLY' ? 'Monthly' : 'Annual'} {billing === 'ANNUAL' && b === 'ANNUAL' && <span className="text-green-600">(20% off)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-3 gap-4">
        {plans.map(plan => {
          const price = billing === 'MONTHLY' ? plan.monthly : plan.annual
          const isCurrent = plan.type === currentPlan
          return (
            <div
              key={plan.type}
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 relative ${
                isCurrent ? 'border-blue-500' : 'border-gray-100'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-4 right-4 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                  Current
                </div>
              )}
              {plan.type === PlanType.INSTITUTE && (
                <div className="absolute top-4 left-4 px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                  RECOMMENDED
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">₹{price}</span>
                  <span className="text-gray-500 text-sm">/{billing === 'MONTHLY' ? 'month' : 'year'}</span>
                </div>
                {billing === 'ANNUAL' && plan.monthly > 0 && (
                  <div className="text-xs text-gray-400 mt-1">Billed annually - Save 20%</div>
                )}
              </div>
              <div className="space-y-2 mb-6">
                {plan.type === PlanType.STARTER && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> All AI-powered insights</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Up to {plan.devices} devices</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Auto-blocking & smart filtering</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Detailed usage reports</div>
                  </>
                )}
                {plan.type === PlanType.INSTITUTE && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Everything in Starter</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Up to {plan.devices} devices</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Custom alerts & rules engine</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Priority support</div>
                  </>
                )}
                {plan.type === PlanType.ENTERPRISE && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Unlimited devices</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Custom pricing</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Dedicated support</div>
                  </>
                )}
              </div>
              <button
                onClick={() => handleUpgrade(plan.type)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade Now →'}
              </button>
              {plan.type === PlanType.STARTER && (
                <div className="text-xs text-gray-400 text-center mt-2">Secure payment via Razorpay</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment Modal */}
      <Modal open={paymentOpen} onClose={() => { setPaymentOpen(false); setPaySuccess(false) }} title="Complete Upgrade" size="md">
        {paySuccess ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-5xl">🎉</div>
            <p className="text-gray-900 font-semibold text-lg">Upgrade Successful!</p>
            <p className="text-sm text-gray-500 text-center">Your plan has been upgraded to {selectedPlan}.</p>
            <button onClick={() => { setPaymentOpen(false); setPaySuccess(false) }} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: '#2563EB' }}>
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Method Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setPayMethod('card')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  payMethod === 'card' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                <CreditCard size={16} className="inline mr-1" /> Card
              </button>
              <button
                onClick={() => setPayMethod('upi')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  payMethod === 'upi' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                <Smartphone size={16} className="inline mr-1" /> UPI
              </button>
            </div>

            {payMethod === 'card' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Card Number</label>
                  <input defaultValue="4111 1111 1111 1111" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Expiry</label>
                    <input defaultValue="12/26" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">CVV</label>
                    <input defaultValue="123" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">UPI ID</label>
                <input defaultValue="demo@upi" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            <button onClick={handlePayment} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: '#2563EB' }}>
              Pay ₹{billing === 'MONTHLY' ? plans.find(p => p.type === selectedPlan)?.monthly : plans.find(p => p.type === selectedPlan)?.annual}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
