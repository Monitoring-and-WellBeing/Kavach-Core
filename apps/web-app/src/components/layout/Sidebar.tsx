"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Shield, Menu, X, LogOut } from "lucide-react";
import {
  LayoutDashboard,
  Monitor,
  BarChart2,
  Brain,
  Sliders,
  Bell,
  Timer,
  CreditCard,
  Settings,
  GraduationCap,
  Target,
  Trophy,
  Users,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { logout } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const parentNav: NavItem[] = [
  { label: "Dashboard", href: "/parent", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Devices", href: "/parent/devices", icon: <Monitor className="w-5 h-5" /> },
  { label: "Reports", href: "/parent/reports", icon: <BarChart2 className="w-5 h-5" /> },
  { label: "AI Insights", href: "/parent/insights", icon: <Brain className="w-5 h-5" /> },
  { label: "App Control", href: "/parent/control", icon: <Sliders className="w-5 h-5" /> },
  { label: "Rules & Alerts", href: "/parent/rules", icon: <Bell className="w-5 h-5" /> },
  { label: "Focus Mode", href: "/parent/focus", icon: <Timer className="w-5 h-5" /> },
  { label: "Subscription", href: "/parent/subscription", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Settings", href: "/parent/settings", icon: <Settings className="w-5 h-5" /> },
];

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Focus Mode", href: "/student/focus", icon: <Timer className="w-5 h-5" /> },
  { label: "My Usage", href: "/student/usage", icon: <BarChart2 className="w-5 h-5" /> },
  { label: "Alerts", href: "/student/alerts", icon: <Bell className="w-5 h-5" /> },
  { label: "Achievements", href: "/student/achievements", icon: <Trophy className="w-5 h-5" /> },
  { label: "Goals", href: "/student/goals", icon: <Target className="w-5 h-5" /> },
  { label: "Settings", href: "/student/settings", icon: <Settings className="w-5 h-5" /> },
];

const instituteNav: NavItem[] = [
  { label: "Dashboard", href: "/institute", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "All Devices", href: "/institute/devices", icon: <Monitor className="w-5 h-5" /> },
  { label: "Students", href: "/institute/students", icon: <Users className="w-5 h-5" /> },
  { label: "Rules", href: "/institute/rules", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Reports", href: "/institute/reports", icon: <BarChart2 className="w-5 h-5" /> },
  { label: "Alerts", href: "/institute/alerts", icon: <Bell className="w-5 h-5" /> },
  { label: "Settings", href: "/institute/settings", icon: <Settings className="w-5 h-5" /> },
];

interface SidebarProps {
  role: "parent" | "student" | "institute";
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ role, userName = "User", userEmail = "" }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const navItems =
    role === "parent"
      ? parentNav
      : role === "student"
      ? studentNav
      : instituteNav;

  const roleLabel =
    role === "parent" ? "Parent" : role === "student" ? "Student" : "Institute Admin";

  const roleIcon =
    role === "parent" ? (
      <Users className="w-4 h-4" />
    ) : role === "student" ? (
      <GraduationCap className="w-4 h-4" />
    ) : (
      <Building2 className="w-4 h-4" />
    );

  return (
    <aside
      className={clsx(
        "flex flex-col h-screen bg-[#0A0F1E] border-r border-[#1E2A45] transition-all duration-300 sticky top-0",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          "flex items-center h-16 px-4 border-b border-[#1E2A45]",
          sidebarCollapsed ? "justify-center" : "gap-2 justify-between"
        )}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">KAVACH</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="text-[#64748B] hover:text-white transition-colors p-1"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === `/${role}`
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-sm font-medium",
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-[#64748B] hover:text-white hover:bg-[#0F1629]",
                sidebarCollapsed && "justify-center"
              )}
            >
              {item.icon}
              {!sidebarCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-[#1E2A45] p-3">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <div className="flex items-center gap-1 text-xs text-[#64748B]">
                {roleIcon}
                <span>{roleLabel}</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-[#64748B] hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Logout"
            className="w-full flex justify-center text-[#64748B] hover:text-red-400 transition-colors p-1"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
