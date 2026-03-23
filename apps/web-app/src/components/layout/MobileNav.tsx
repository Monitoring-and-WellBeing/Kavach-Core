"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Monitor,
  BarChart2,
  Bell,
  Settings,
} from "lucide-react";

interface MobileNavProps {
  role: "parent" | "student" | "institute";
}

const parentItems = [
  { label: "Home", href: "/parent", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Devices", href: "/parent/devices", icon: <Monitor className="w-5 h-5" /> },
  { label: "Reports", href: "/parent/reports", icon: <BarChart2 className="w-5 h-5" /> },
  { label: "Alerts", href: "/parent/rules", icon: <Bell className="w-5 h-5" /> },
  { label: "Settings", href: "/parent/settings", icon: <Settings className="w-5 h-5" /> },
];

export function MobileNav({ role: _role }: MobileNavProps) {
  const pathname = usePathname();
  const items = parentItems; // expand for other roles as needed

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0F1E] border-t border-[#1E2A45] z-40 md:hidden">
      <div className="flex">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive ? "text-blue-400" : "text-[#64748B]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
