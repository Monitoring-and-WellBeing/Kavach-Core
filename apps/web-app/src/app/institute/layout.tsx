'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Monitor, Users, Shield,
  BarChart3, Bell, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

const navItems = [
  { label: 'Dashboard',   icon: <LayoutDashboard size={18} />, href: '/institute' },
  { label: 'All Devices', icon: <Monitor size={18} />,         href: '/institute/devices' },
  { label: 'Students',    icon: <Users size={18} />,           href: '/institute/students' },
  { label: 'Global Rules',icon: <Shield size={18} />,          href: '/institute/rules' },
  { label: 'Reports',     icon: <BarChart3 size={18} />,       href: '/institute/reports' },
  { label: 'Alerts',      icon: <Bell size={18} />,            href: '/institute/alerts' },
  { label: 'Settings',    icon: <Settings size={18} />,        href: '/institute/settings' },
]

export default function InstituteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
        style={{ background: '#1a1a2e' }}
      >
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <Shield size={18} className="text-white" />
          </div>
          {!collapsed && <div><div className="text-white font-bold text-sm">KAVACH AI</div></div>}
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active =
              item.href === '/institute'
                ? pathname === item.href
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={active ? { background: '#2563EB' } : {}}
              >
                {item.icon}
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 cursor-pointer mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">AS</div>
              <div>
                <div className="text-white text-xs font-medium">Aarav Singh</div>
                <div className="text-gray-400 text-xs">Institute Admin</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-gray-900 font-bold text-lg md:text-xl">Institute Dashboard</h1>
            <p className="text-gray-400 text-sm hidden sm:block">Manage all lab devices and students</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">AS</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-safe md:pb-0 main-content" style={{ background: '#f8fafc' }}>
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav role="institute" />
    </div>
  )
}
