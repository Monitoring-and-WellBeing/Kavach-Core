import { useState } from "react";
import { Subscription, PlanType } from "@kavach/shared-types";
import { mockSubscription, mockUsage } from "@/mock/subscription";

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription>(mockSubscription);
  const [usage] = useState(mockUsage);
  const [upgrading, setUpgrading] = useState(false);

  const upgradePlan = async (plan: PlanType, billingCycle: "MONTHLY" | "ANNUAL") => {
    setUpgrading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const limits: Record<PlanType, number> = {
      FREE_TRIAL: 5,
      STARTER: 50,
      INSTITUTE: 300,
      ENTERPRISE: 99999,
    };
    setSubscription((s) => ({
      ...s,
      plan,
      billingCycle,
      deviceLimit: limits[plan],
      status: "ACTIVE",
    }));
    setUpgrading(false);
  };

  return { subscription, usage, upgrading, upgradePlan };
}
