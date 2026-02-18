"use client";

import { useState } from "react";
import { useFocusMode } from "@/hooks/useFocusMode";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { FocusPresets } from "@/components/focus/FocusPresets";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";

const sessionHistory = [
  { date: "Today", duration: 25, status: "ENDED" as const, emoji: "✅" },
  { date: "Yesterday", duration: 50, status: "ENDED" as const, emoji: "✅" },
  { date: "2 days ago", duration: 25, status: "INTERRUPTED" as const, emoji: "⚠️" },
  { date: "3 days ago", duration: 90, status: "ENDED" as const, emoji: "✅" },
];

export default function StudentFocusPage() {
  const { active, remaining, elapsedSeconds, totalSeconds, startFocus, endFocus } = useFocusMode();
  const addToast = useUIStore((s) => s.addToast);
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState(30);

  const handleStart = () => {
    const d = duration === 0 ? customDuration : duration;
    startFocus("dev-001", d, ["VS Code", "Google Chrome"]);
    addToast({ title: `Focus started — ${d} minutes! You got this 💪`, type: "success" });
  };

  const handleEnd = () => {
    endFocus();
    addToast({ title: "Focus session completed! Great work 🎉", type: "success" });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Focus Mode</h2>
        <p className="text-[#64748B] text-sm mt-1">Block distractions and get things done!</p>
      </div>

      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-6">
          <FocusTimer totalSeconds={totalSeconds} elapsedSeconds={elapsedSeconds} active={active} />
          {!active ? (
            <>
              <FocusPresets value={duration} onChange={setDuration} />
              {duration === 0 && (
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  min={5}
                  max={300}
                  placeholder="Minutes"
                  className="w-32 text-center px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              )}
              <Button size="lg" onClick={handleStart}>
                🎯 Start Focus
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-green-400">Allowed: VS Code, Chrome</p>
              <Button variant="danger" onClick={handleEnd}>
                End Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Session History</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {sessionHistory.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#0A0F1E] rounded-xl border border-[#1E2A45]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{s.emoji}</span>
                  <div>
                    <p className="text-sm text-white">{s.date}</p>
                    <p className="text-xs text-[#64748B]">{s.duration} minute session</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${s.status === "ENDED" ? "text-green-400" : "text-yellow-400"}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
