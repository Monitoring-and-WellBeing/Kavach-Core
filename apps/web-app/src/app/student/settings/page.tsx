"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";

export default function StudentSettings() {
  const addToast = useUIStore(s => s.addToast);
  const [name, setName] = useState("Rahul Sharma");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4">Profile</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-[#94A3B8] block mb-1.5">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button onClick={() => addToast({ title: "Settings saved!", type: "success" })}>
            Save
          </Button>
        </div>
      </div>
      <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-2">Notifications</h3>
        <p className="text-xs text-[#64748B] mb-4">Receive encouragement and goal reminders.</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Push Notifications</span>
          <button
            onClick={() => setNotifications(n => !n)}
            className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? "bg-blue-600" : "bg-[#1E2A45]"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${notifications ? "translate-x-5.5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
