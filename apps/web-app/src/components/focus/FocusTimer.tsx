"use client";

import { clsx } from "clsx";

interface FocusTimerProps {
  totalSeconds: number;
  elapsedSeconds: number;
  active: boolean;
}

export function FocusTimer({ totalSeconds, elapsedSeconds, active }: FocusTimerProps) {
  const remaining = totalSeconds - elapsedSeconds;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1E2A45"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className={clsx("text-sm mt-1", active ? "text-blue-400" : "text-[#64748B]")}>
            {active ? "Focus Active" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
