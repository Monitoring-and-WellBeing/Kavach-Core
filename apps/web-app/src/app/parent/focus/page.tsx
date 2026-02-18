"use client";

import { useState } from "react";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useDevices } from "@/hooks/useDevices";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { FocusPresets } from "@/components/focus/FocusPresets";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useUIStore } from "@/store/uiStore";
import { Plus, X } from "lucide-react";

export default function FocusPage() {
  const { devices } = useDevices();
  const { active, remaining, elapsedSeconds, totalSeconds, progress, startFocus, endFocus } = useFocusMode();
  const addToast = useUIStore((s) => s.addToast);

  const [selectedDevice, setSelectedDevice] = useState(devices[0]?.id || "");
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState(30);
  const [allowedApps, setAllowedApps] = useState<string[]>(["VS Code", "Google Chrome"]);
  const [newApp, setNewApp] = useState("");

  const handleStart = () => {
    const d = duration === 0 ? customDuration : duration;
    startFocus(selectedDevice, d, allowedApps);
    addToast({ title: `Focus Mode started — ${d} minutes`, type: "success" });
  };

  const handleEnd = () => {
    endFocus();
    addToast({ title: "Focus session ended", type: "info" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — Timer */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">Focus Session</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <FocusTimer
              totalSeconds={totalSeconds}
              elapsedSeconds={elapsedSeconds}
              active={active}
            />
            {!active ? (
              <div className="flex flex-col gap-4 w-full">
                <Select
                  options={devices.map((d) => ({ label: d.name, value: d.id }))}
                  value={selectedDevice}
                  onChange={setSelectedDevice}
                  placeholder="Select device"
                />
                <FocusPresets value={duration} onChange={setDuration} />
                {duration === 0 && (
                  <div>
                    <label className="text-sm text-[#94A3B8] block mb-1">Custom (minutes)</label>
                    <input
                      type="number"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      min={5}
                      max={300}
                      className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                )}
                <Button onClick={handleStart} disabled={!selectedDevice} size="lg">
                  🎯 Start Focus Mode
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-sm text-[#94A3B8]">Focus mode is active on the selected device.</p>
                <Button variant="danger" onClick={handleEnd} size="lg">
                  End Session
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right — Allowed Apps */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">Allowed Apps During Focus</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={newApp}
                onChange={(e) => setNewApp(e.target.value)}
                placeholder="Add app name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newApp.trim()) {
                    setAllowedApps((p) => [...p, newApp.trim()]);
                    setNewApp("");
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  if (newApp.trim()) {
                    setAllowedApps((p) => [...p, newApp.trim()]);
                    setNewApp("");
                  }
                }}
                className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {allowedApps.map((app) => (
                <div
                  key={app}
                  className="flex items-center justify-between px-3 py-2 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg"
                >
                  <span className="text-sm text-white">✓ {app}</span>
                  <button
                    onClick={() => setAllowedApps((p) => p.filter((a) => a !== app))}
                    className="text-[#64748B] hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              All other apps will be blocked during the focus session.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
