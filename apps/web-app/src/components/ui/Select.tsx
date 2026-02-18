"use client";

import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({ options, value, onChange, placeholder, className }: SelectProps) {
  return (
    <div className={clsx("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-2.5 pr-10 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
    </div>
  );
}
