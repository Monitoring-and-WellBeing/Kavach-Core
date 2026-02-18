"use client";

import { PlanType } from "@kavach/shared-types";
import { PLAN_LIMITS } from "@kavach/shared-constants";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PlanCardProps {
  plan: PlanType;
  billing: "MONTHLY" | "ANNUAL";
  current: PlanType;
  onSelect: (plan: PlanType) => void;
}

const planConfig: Record<PlanType, { label: string; features: string[]; highlight?: boolean }> = {
  FREE_TRIAL: {
    label: "Free Trial",
    features: ["Up to 5 devices", "Basic monitoring", "7-day history", "Email alerts"],
  },
  STARTER: {
    label: "Starter",
    features: ["Up to 50 devices", "Full monitoring", "30-day history", "Push + Email alerts", "AI Insights (basic)"],
    highlight: true,
  },
  INSTITUTE: {
    label: "Institute",
    features: ["Up to 300 devices", "Advanced analytics", "90-day history", "All alert types", "AI Insights (full)", "Local server support"],
    highlight: false,
  },
  ENTERPRISE: {
    label: "Enterprise",
    features: ["Unlimited devices", "Custom analytics", "1-year history", "Dedicated support", "On-premise deployment", "Custom integrations"],
  },
};

export function PlanCard({ plan, billing, current, onSelect }: PlanCardProps) {
  const limits = PLAN_LIMITS[plan];
  const price = billing === "ANNUAL" ? limits.annualPrice : limits.price;
  const config = planConfig[plan];
  const isCurrent = plan === current;

  return (
    <div
      className={clsx(
        "bg-[#0F1629] border rounded-2xl p-6 flex flex-col gap-4 transition-all",
        isCurrent
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : config.highlight
          ? "border-blue-500/40"
          : "border-[#1E2A45]"
      )}
    >
      {config.highlight && (
        <span className="self-start text-xs font-bold px-2.5 py-1 bg-blue-600 text-white rounded-full">
          Popular
        </span>
      )}
      {isCurrent && (
        <span className="self-start text-xs font-bold px-2.5 py-1 bg-green-600/20 text-green-400 border border-green-500/30 rounded-full">
          Current Plan
        </span>
      )}
      <div>
        <h3 className="text-xl font-bold text-white">{config.label}</h3>
        <div className="flex items-end gap-1 mt-2">
          {price === 0 ? (
            <span className="text-3xl font-bold text-white">
              {plan === "FREE_TRIAL" ? "Free" : "Custom"}
            </span>
          ) : (
            <>
              <span className="text-3xl font-bold text-white">₹{price}</span>
              <span className="text-sm text-[#64748B] mb-1">/device/month</span>
            </>
          )}
        </div>
        {billing === "ANNUAL" && price > 0 && (
          <p className="text-xs text-green-400 mt-1">20% off with annual billing</p>
        )}
        <p className="text-sm text-[#64748B] mt-1">
          {limits.devices < 99999 ? `Up to ${limits.devices} devices` : "Unlimited devices"}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {config.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[#94A3B8]">
            <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        variant={isCurrent ? "secondary" : "primary"}
        disabled={isCurrent || plan === "FREE_TRIAL"}
        onClick={() => onSelect(plan)}
        className="mt-auto"
      >
        {isCurrent ? "Current Plan" : plan === "ENTERPRISE" ? "Contact Sales" : "Upgrade"}
      </Button>
    </div>
  );
}
