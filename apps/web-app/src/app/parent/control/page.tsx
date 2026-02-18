"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useUIStore } from "@/store/uiStore";
import { AppCategory } from "@kavach/shared-types";
import { APP_CATEGORIES } from "@kavach/shared-constants";
import { mockAppUsage } from "@/mock/activity";
import { Search, Shield } from "lucide-react";

const tabs = [
  { id: "apps", label: "App Control" },
  { id: "categories", label: "Category Control" },
  { id: "websites", label: "Website Control" },
];

type AppRule = { blocked: boolean; limitMin: number };

export default function ControlPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [appSearch, setAppSearch] = useState("");
  const [appRules, setAppRules] = useState<Record<string, AppRule>>(
    Object.fromEntries(
      mockAppUsage.map((a) => [a.appName, { blocked: a.isBlocked, limitMin: 60 }])
    )
  );
  const [categoryBlocks, setCategoryBlocks] = useState<Record<string, boolean>>({
    GAMING: true,
    SOCIAL_MEDIA: true,
    ENTERTAINMENT: false,
    EDUCATION: false,
    PRODUCTIVITY: false,
    COMMUNICATION: false,
    NEWS: false,
    OTHER: false,
  });
  const [websiteInput, setWebsiteInput] = useState("");
  const [blockedSites, setBlockedSites] = useState(["tiktok.com", "instagram.com", "reddit.com"]);

  const toggleApp = (appName: string) => {
    setAppRules((prev) => ({
      ...prev,
      [appName]: { ...prev[appName], blocked: !prev[appName]?.blocked },
    }));
    addToast({ title: "Rule updated", type: "success" });
  };

  const toggleCategory = (cat: string) => {
    setCategoryBlocks((prev) => ({ ...prev, [cat]: !prev[cat] }));
    addToast({ title: "Category rule updated", type: "success" });
  };

  const addBlockedSite = () => {
    if (!websiteInput.trim()) return;
    setBlockedSites((prev) => [...prev, websiteInput.trim()]);
    setWebsiteInput("");
    addToast({ title: `${websiteInput} blocked`, type: "success" });
  };

  const removeSite = (site: string) => {
    setBlockedSites((prev) => prev.filter((s) => s !== site));
    addToast({ title: `${site} unblocked`, type: "info" });
  };

  const filteredApps = mockAppUsage.filter((a) =>
    a.appName.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <Tabs tabs={tabs}>
      {(activeTab) => (
        <>
          {activeTab === "apps" && (
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Search apps..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
              <div className="flex flex-col gap-2">
                {filteredApps.map((app) => {
                  const rule = appRules[app.appName] || { blocked: false, limitMin: 60 };
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 bg-[#0F1629] border border-[#1E2A45] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1E2A45] rounded-lg flex items-center justify-center text-sm">
                          {app.appName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{app.appName}</p>
                          <p className="text-xs text-[#64748B]">{app.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={rule.limitMin}
                          onChange={(e) => {
                            setAppRules((p) => ({
                              ...p,
                              [app.appName]: { ...p[app.appName], limitMin: Number(e.target.value) },
                            }));
                          }}
                          className="w-16 text-center px-2 py-1 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white text-xs focus:outline-none"
                          min={0}
                        />
                        <span className="text-xs text-[#64748B]">min/day</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#64748B]">Block</span>
                          <Toggle checked={rule.blocked} onChange={() => toggleApp(app.appName)} size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(APP_CATEGORIES).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-[#0F1629] border border-[#1E2A45] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${categoryBlocks[key] ? "text-red-400" : "text-[#64748B]"}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-[#64748B]">
                        {categoryBlocks[key] ? "Blocked" : "Allowed"}
                      </p>
                    </div>
                  </div>
                  <Toggle checked={categoryBlocks[key]} onChange={() => toggleCategory(key)} />
                </div>
              ))}
            </div>
          )}

          {activeTab === "websites" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter domain (e.g. example.com)"
                  value={websiteInput}
                  onChange={(e) => setWebsiteInput(e.target.value)}
                  className="flex-1"
                />
                <button
                  onClick={addBlockedSite}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Block Site
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {blockedSites.map((site) => (
                  <div
                    key={site}
                    className="flex items-center justify-between p-4 bg-[#0F1629] border border-[#1E2A45] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-mono text-white">{site}</span>
                    </div>
                    <button
                      onClick={() => removeSite(site)}
                      className="text-xs text-[#64748B] hover:text-green-400 transition-colors"
                    >
                      Unblock
                    </button>
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
