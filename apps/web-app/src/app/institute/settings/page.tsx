"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useUIStore } from "@/store/uiStore";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/axios";

export default function InstituteSettings() {
  const addToast = useUIStore(s => s.addToast);
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    instituteName: "",
    city: "",
    state: "",
    adminEmail: "",
    localServer: false,
  });

  // Pre-fill from auth context (institute tenant profile)
  useEffect(() => {
    if (!user) return;
    setForm(f => ({
      ...f,
      adminEmail: user.email ?? "",
      instituteName: (user as any).instituteName ?? "",
      city: (user as any).city ?? "",
      state: (user as any).state ?? "",
    }));
    // Also fetch current tenant settings from server
    api.get("/tenant/settings")
      .then(r => {
        const d = r.data as any;
        setForm({
          instituteName: d.instituteName ?? "",
          city: d.city ?? "",
          state: d.state ?? "",
          adminEmail: d.adminEmail ?? user.email ?? "",
          localServer: d.localServer ?? false,
        });
      })
      .catch(() => {/* use auth values as fallback */});
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/tenant/settings", {
        instituteName: form.instituteName,
        city: form.city,
        state: form.state,
        localServer: form.localServer,
      });
      addToast({ title: "Settings saved!", type: "success" });
    } catch {
      addToast({ title: "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4">Institute Profile</h3>
        <div className="flex flex-col gap-4">
          {[
            { key: "instituteName", label: "Institute Name" },
            { key: "city", label: "City" },
            { key: "state", label: "State" },
            { key: "adminEmail", label: "Admin Email", readOnly: true },
          ].map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-[#94A3B8] block mb-1.5">{field.label}</label>
              <input
                value={form[field.key as keyof typeof form] as string}
                onChange={e => !field.readOnly && setForm(f => ({ ...f, [field.key]: e.target.value }))}
                readOnly={field.readOnly}
                className={`w-full px-4 py-2.5 border border-[#1E2A45] rounded-lg text-sm focus:outline-none focus:border-blue-500 ${
                  field.readOnly
                    ? "bg-[#0A0F1E]/50 text-[#64748B] cursor-not-allowed"
                    : "bg-[#0A0F1E] text-white"
                }`}
              />
              {field.readOnly && (
                <p className="text-xs text-[#64748B] mt-1">Email cannot be changed here. Contact support.</p>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between p-3 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">Local Server Mode</p>
              <p className="text-xs text-[#64748B]">On-premise deployment for offline labs</p>
            </div>
            <Toggle checked={form.localServer} onChange={v => setForm(f => ({ ...f, localServer: v }))} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
