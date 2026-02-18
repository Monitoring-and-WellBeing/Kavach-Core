"use client";

import { clsx } from "clsx";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Toggle({ checked, onChange, disabled, size = "md" }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-blue-600" : "bg-[#1E2A45]",
        size === "sm" ? "h-5 w-9" : "h-6 w-11"
      )}
    >
      <span
        className={clsx(
          "pointer-events-none inline-block rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          checked
            ? size === "sm"
              ? "translate-x-4"
              : "translate-x-5"
            : "translate-x-0"
        )}
      />
    </button>
  );
}
