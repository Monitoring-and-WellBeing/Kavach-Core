"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { PlanCard } from "@/components/subscription/PlanCard";
import { BillingToggle } from "@/components/subscription/BillingToggle";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useUIStore } from "@/store/uiStore";
import { PlanType } from "@kavach/shared-types";

export default function SubscriptionPage() {
  const { subscription, usage, upgrading, upgradePlan } = useSubscription();
  const [billing, setBilling] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [paySuccess, setPaySuccess] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const handleSelectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setPaymentOpen(true);
    setPaySuccess(false);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    await upgradePlan(selectedPlan, billing);
    setPaySuccess(true);
    addToast({ title: "Plan upgraded successfully!", type: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Current plan usage bar */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-white">
                Current Plan: <span className="text-blue-400">{subscription.plan}</span>
              </p>
              <p className="text-xs text-[#64748B]">
                {usage.devicesUsed} / {usage.deviceLimit} devices used
              </p>
            </div>
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20 font-medium">
              {subscription.status}
            </span>
          </div>
          <div className="h-2 bg-[#1E2A45] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${usage.percentUsed}%` }}
            />
          </div>
          <p className="text-xs text-[#64748B] mt-1">{usage.percentUsed}% capacity used</p>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <BillingToggle value={billing} onChange={setBilling} />
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[PlanType.STARTER, PlanType.INSTITUTE, PlanType.ENTERPRISE].map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            billing={billing}
            current={subscription.plan}
            onSelect={handleSelectPlan}
          />
        ))}
      </div>

      {/* Payment Modal */}
      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Complete Upgrade"
        size="sm"
      >
        {paySuccess ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-4xl">🎉</div>
            <p className="text-white font-semibold">Upgrade Successful!</p>
            <p className="text-sm text-[#64748B] text-center">
              Your plan has been upgraded to {selectedPlan}.
            </p>
            <Button onClick={() => setPaymentOpen(false)}>Close</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Card Number</label>
              <input
                defaultValue="4111 1111 1111 1111"
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Expiry</label>
                <input
                  defaultValue="12/26"
                  className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">CVV</label>
                <input
                  defaultValue="123"
                  className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Or pay via UPI</label>
              <input
                defaultValue="demo@upi"
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <Button loading={upgrading} onClick={handlePayment}>
              Confirm Payment
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
