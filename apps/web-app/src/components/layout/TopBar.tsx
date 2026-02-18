"use client";

import { Bell, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { formatTime } from "@kavach/shared-utils";
import { logout } from "@/lib/auth";
import { clsx } from "clsx";

interface TopBarProps {
  title: string;
  userName?: string;
}

export function TopBar({ title, userName = "User" }: TopBarProps) {
  const { alerts, unreadCount, markRead } = useAlerts();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const recentAlerts = alerts.slice(0, 5);

  return (
    <header className="h-16 bg-[#0A0F1E] border-b border-[#1E2A45] flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-xl font-bold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAlerts(!showAlerts);
              setShowUser(false);
            }}
            className="relative p-2 text-[#64748B] hover:text-white hover:bg-[#0F1629] rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-12 w-96 bg-[#0F1629] border border-[#1E2A45] rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2A45]">
                <span className="font-semibold text-white text-sm">Notifications</span>
                <span className="text-xs text-[#64748B]">{unreadCount} unread</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[#1E2A45]">
                {recentAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => markRead(alert.id)}
                    className={clsx(
                      "w-full text-left px-4 py-3 hover:bg-[#0A0F1E] transition-colors",
                      !alert.read && "bg-blue-500/5"
                    )}
                  >
                    <p className="text-sm text-white leading-snug">{alert.message}</p>
                    <p className="text-xs text-[#64748B] mt-1">{formatTime(alert.timestamp)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUser(!showUser);
              setShowAlerts(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1629] border border-[#1E2A45] rounded-lg hover:border-blue-500/50 transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white hidden md:block">{userName}</span>
          </button>

          {showUser && (
            <div className="absolute right-0 top-12 w-48 bg-[#0F1629] border border-[#1E2A45] rounded-xl shadow-2xl z-50">
              <a
                href="/parent/settings"
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#94A3B8] hover:text-white hover:bg-[#0A0F1E] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </a>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#94A3B8] hover:text-white hover:bg-[#0A0F1E] transition-colors"
              >
                <User className="w-4 h-4" />
                Switch Role
              </a>
              <hr className="border-[#1E2A45]" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-[#0A0F1E] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
