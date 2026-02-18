"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/institute": "Institute Dashboard",
  "/institute/devices": "All Devices",
  "/institute/students": "Students",
  "/institute/rules": "Global Rules",
  "/institute/reports": "Reports",
  "/institute/alerts": "All Alerts",
  "/institute/settings": "Settings",
};

export default function InstituteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "KAVACH AI";

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar role="institute" userName="Institute Admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} userName="School Admin" />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
