"use client";

import { RuleType } from "@kavach/shared-types";
import { clsx } from "clsx";

interface RuleTypeSelectorProps {
  value: RuleType;
  onChange: (type: RuleType) => void;
}

const types = [
  { type: RuleType.CATEGORY_BLOCK, label: "Category", icon: "🏷️" },
  { type: RuleType.APP_LIMIT, label: "App Limit", icon: "⏱️" },
  { type: RuleType.SCHEDULE_BLOCK, label: "Schedule", icon: "📅" },
  { type: RuleType.WEBSITE_BLOCK, label: "Website", icon: "🌐" },
  { type: RuleType.FOCUS_MODE, label: "Focus", icon: "🎯" },
];

export function RuleTypeSelector({ value, onChange }: RuleTypeSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {types.map((t) => (
        <button
          key={t.type}
          onClick={() => onChange(t.type)}
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
            value === t.type
              ? "border-blue-500 bg-blue-500/10 text-blue-400"
              : "border-[#1E2A45] text-[#64748B] hover:text-white hover:border-[#2E3A55]"
          )}
        >
          <span>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
