"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useUIStore } from "@/store/uiStore";
import { mockStudents } from "@/mock/students";
import { User, Users, Shield, Bell } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { id: "children", label: "Children", icon: <Users className="w-4 h-4" /> },
  { id: "privacy", label: "Privacy", icon: <Shield className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [profile, setProfile] = useState({ name: "Rajesh Kumar", email: "parent@demo.com", phone: "+91 98765 43210" });
  const [notifications, setNotifications] = useState({
    pushEnabled: true, emailEnabled: true, smsEnabled: false,
    lateNight: true, usageSpike: true, blockedAttempt: true, limitReached: false,
  });
  const [privacy, setPrivacy] = useState({ dataSharing: false, analyticsEnabled: true, screenshotMonitor: false });

  return (
    <Tabs tabs={tabs}>
      {(activeTab) => (
        <>
          {activeTab === "profile" && (
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col gap-4 max-w-md">
                  {[
                    { key: "name", label: "Full Name" },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-sm font-medium text-[#94A3B8] block mb-1.5">{field.label}</label>
                      <input
                        value={profile[field.key as keyof typeof profile]}
                        onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                  <Button onClick={() => addToast({ title: "Profile saved!", type: "success" })}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "children" && (
            <div className="flex flex-col gap-4">
              {mockStudents.map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{s.name}</p>
                          <p className="text-xs text-[#64748B]">{s.grade} · Age {s.age} · Focus: {s.focusScore}%</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="ghost" className="text-red-400">Remove</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="flex flex-col gap-4">
              {[
                { key: "dataSharing", label: "Share anonymized data with research", desc: "Helps improve KAVACH AI models" },
                { key: "analyticsEnabled", label: "Enable usage analytics", desc: "Track how you use the dashboard" },
                { key: "screenshotMonitor", label: "Screenshot monitoring", desc: "Capture periodic screenshots of monitored devices" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-[#0F1629] border border-[#1E2A45] rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={privacy[item.key as keyof typeof privacy]}
                    onChange={(v) => setPrivacy((p) => ({ ...p, [item.key]: v }))}
                  />
                </div>
              ))}
              <button
                onClick={() => addToast({ title: "Data deletion requested", description: "We'll process your request within 30 days.", type: "info" })}
                className="text-sm text-red-400 hover:underline self-start"
              >
                Request data deletion
              </button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-[#94A3B8] mb-3 uppercase tracking-wide">Channels</p>
                {[
                  { key: "pushEnabled", label: "Push Notifications" },
                  { key: "emailEnabled", label: "Email Notifications" },
                  { key: "smsEnabled", label: "SMS Alerts" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#0F1629] border border-[#1E2A45] rounded-xl mb-2">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <Toggle
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(v) => setNotifications((n) => ({ ...n, [item.key]: v }))}
                    />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-[#94A3B8] mb-3 uppercase tracking-wide">Alert Types</p>
                {[
                  { key: "lateNight", label: "Late Night Usage" },
                  { key: "usageSpike", label: "Usage Spike" },
                  { key: "blockedAttempt", label: "Blocked Attempt" },
                  { key: "limitReached", label: "Limit Reached" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#0F1629] border border-[#1E2A45] rounded-xl mb-2">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <Toggle
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(v) => setNotifications((n) => ({ ...n, [item.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Tabs>
  );
}
