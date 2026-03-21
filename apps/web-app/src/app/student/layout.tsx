"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, Timer, TrendingUp, BookOpen, Trophy,
  Target, Calendar, Settings, Bell,
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";

const navItems = [
  { label: "Dashboard",    icon: <Zap size={18} />,        href: "/student" },
  { label: "Focus Mode",   icon: <Timer size={18} />,       href: "/student/focus" },
  { label: "My Progress",  icon: <TrendingUp size={18} />,  href: "/student/progress" },
  { label: "Learning Hub", icon: <BookOpen size={18} />,    href: "/student/learning" },
  { label: "Achievements", icon: <Trophy size={18} />,      href: "/student/achievements" },
  { label: "Goals",        icon: <Target size={18} />,      href: "/student/goals" },
  { label: "Schedule",     icon: <Calendar size={18} />,    href: "/student/schedule" },
  { label: "Settings",     icon: <Settings size={18} />,    href: "/student/settings" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const { streak } = useStudentDashboard();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <aside
        className="hidden md:flex w-52 flex-shrink-0 flex-col"
        style={{ background: "#1a1a2e" }}
      >
        <div className="p-5 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #3B82F6)" }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">KAVACH AI</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>
              Student Portal
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href === "/student"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={active ? { background: "#7C3AED" } : {}}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="m-3 p-4 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-purple-200" />
            <span className="text-purple-200 text-xs font-medium">Focus Streak</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {streak > 0 ? `${streak} Day${streak === 1 ? "" : "s"}` : "—"}
          </div>
          <div className="text-purple-200 text-xs mt-1">
            {streak > 0 ? "Keep it up!" : "Start your streak today"}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-gray-900 font-bold text-lg md:text-xl">Dashboard</h1>
            <p className="text-gray-400 text-sm hidden sm:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="hidden sm:flex bg-gray-100 rounded-xl p-1">
              <button
                className="px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: "#2563EB" }}
              >
                Student
              </button>
              <Link
                href="/parent"
                className="px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition-all"
              >
                Parent
              </Link>
            </div>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto pb-safe md:pb-0 main-content"
          style={{ background: "#f0f2f5" }}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav role="student" />
    </div>
  );
}
