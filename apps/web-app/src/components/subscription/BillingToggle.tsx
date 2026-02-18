"use client";

import { clsx } from "clsx";

interface BillingToggleProps {
  value: "MONTHLY" | "ANNUAL";
  onChange: (v: "MONTHLY" | "ANNUAL") => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange("MONTHLY")}
        className={clsx(
          "text-sm font-medium transition-colors",
          value === "MONTHLY" ? "text-white" : "text-[#64748B]"
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange(value === "MONTHLY" ? "ANNUAL" : "MONTHLY")}
        className={clsx(
          "relative w-12 h-6 rounded-full transition-colors",
          value === "ANNUAL" ? "bg-blue-600" : "bg-[#1E2A45]"
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow",
            value === "ANNUAL" ? "translate-x-6" : "translate-x-0.5"
          )}
        />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange("ANNUAL")}
          className={clsx(
            "text-sm font-medium transition-colors",
            value === "ANNUAL" ? "text-white" : "text-[#64748B]"
          )}
        >
          Annual
        </button>
        <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium">
          Save 20%
        </span>
      </div>
    </div>
  );
}
