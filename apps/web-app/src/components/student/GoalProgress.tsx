interface GoalProgressProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

export function GoalProgress({ label, current, target, unit = "min", color = "#3b82f6" }: GoalProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#94A3B8]">{label}</span>
        <span className="text-sm font-medium text-white">
          {current} / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-[#1E2A45] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
      <p className="text-xs text-[#64748B] mt-1">{Math.round(percentage)}% complete</p>
    </div>
  );
}
