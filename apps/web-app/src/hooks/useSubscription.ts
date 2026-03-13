import { useState, useEffect, useCallback } from "react";
import { subscriptionApi, Subscription, Plan } from "@/lib/subscription";

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sub, planList] = await Promise.all([
        subscriptionApi.getCurrent(),
        subscriptionApi.getPlans().catch(() => [] as Plan[]),
      ]);
      setSubscription(sub);
      setPlans(planList);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upgradePlan = useCallback(async (planCode: string) => {
    setUpgrading(true);
    try {
      // create-order returns Razorpay order; caller should handle payment UI
      const order = await subscriptionApi.createOrder(planCode);
      return order;
    } finally {
      setUpgrading(false);
    }
  }, []);

  const onPaymentSuccess = useCallback(async (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    planCode: string;
  }) => {
    const updated = await subscriptionApi.verifyPayment(data);
    setSubscription(updated);
    return updated;
  }, []);

  // Derived usage values for backwards-compat
  const usage = subscription
    ? {
        devices: subscription.deviceCount,
        maxDevices: subscription.maxDevices,
        usagePercent: subscription.deviceUsagePercent,
        nearLimit: subscription.nearLimit,
        atLimit: subscription.atLimit,
      }
    : null;

  return {
    subscription,
    plans,
    usage,
    loading,
    upgrading,
    error,
    upgradePlan,
    onPaymentSuccess,
    refetch: load,
  };
}
