import { clsx } from "clsx";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#94A3B8]">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            "w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors text-sm",
            icon && "pl-10",
            error && "border-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
