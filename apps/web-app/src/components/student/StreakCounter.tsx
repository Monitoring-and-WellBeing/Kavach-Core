interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-2xl font-bold text-white">{streak}</p>
        <p className="text-xs text-[#64748B]">Day streak</p>
      </div>
    </div>
  );
}
