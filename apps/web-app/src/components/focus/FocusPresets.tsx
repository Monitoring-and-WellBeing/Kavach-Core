"use client";

import { FOCUS_PRESETS } from "@kavach/shared-constants";
import { clsx } from "clsx";

interface FocusPresetsProps {
  value: number;
  onChange: (value: number) => void;
}

export function FocusPresets({ value, onChange }: FocusPresetsProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {FOCUS_PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={clsx(
            "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
            value === preset.value
              ? "border-blue-500 bg-blue-500/15 text-blue-400"
              : "border-[#1E2A45] text-[#64748B] hover:text-white hover:border-[#2E3A55]"
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
