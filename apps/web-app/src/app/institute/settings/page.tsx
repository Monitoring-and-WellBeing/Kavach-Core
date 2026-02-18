"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useUIStore } from "@/store/uiStore";

export default function InstituteSettings() {
  const addToast = useUIStore(s => s.addToast);
  const [form, setForm] = useState({
    instituteName: "DPS Computer Lab",
    city: "New Delhi",
    state: "Delhi",
    adminEmail: "admin@demo.com",
    localServer: false,
  });

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4">Institute Profile</h3>
        <div className="flex flex-col gap-4">
          {[
            { key: "instituteName", label: "Institute Name" },
            { key: "city", label: "City" },
            { key: "state", label: "State" },
            { key: "adminEmail", label: "Admin Email" },
          ].map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-[#94A3B8] block mb-1.5">{field.label}</label>
              <input
                value={form[field.key as keyof typeof form] as string}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div className="flex items-center justify-between p-3 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">Local Server Mode</p>
              <p className="text-xs text-[#64748B]">On-premise deployment for offline labs</p>
            </div>
            <Toggle checked={form.localServer} onChange={v => setForm(f => ({ ...f, localServer: v }))} />
          </div>
          <Button onClick={() => addToast({ title: "Settings saved!", type: "success" })}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
