'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Monitor, BarChart2, Bell, Shield,
  Target, Trophy, Users, BookOpen,
} from 'lucide-react'

const PARENT_TABS = [
  { href: '/parent',           icon: LayoutDashboard, label: 'Home'     },
  { href: '/parent/devices',   icon: Monitor,         label: 'Devices'  },
  { href: '/parent/reports',   icon: BarChart2,       label: 'Reports'  },
  { href: '/parent/rules',     icon: Bell,            label: 'Alerts'   },
  { href: '/parent/control',   icon: Shield,          label: 'Block'    },
]

const STUDENT_TABS = [
  { href: '/student',                icon: LayoutDashboard, label: 'Home'   },
  { href: '/student/focus',          icon: Target,          label: 'Focus'  },
  { href: '/student/achievements',   icon: Trophy,          label: 'Badges' },
]

const INSTITUTE_TABS = [
  { href: '/institute',          icon: LayoutDashboard, label: 'Home'     },
  { href: '/institute/devices',  icon: Monitor,         label: 'Devices'  },
  { href: '/institute/students', icon: Users,           label: 'Students' },
  { href: '/institute/rules',    icon: BookOpen,        label: 'Rules'    },
  { href: '/institute/alerts',   icon: Bell,            label: 'Alerts'   },
]

export function BottomNav({ role }: { role: 'parent' | 'student' | 'institute' }) {
  const pathname = usePathname()
  const tabs =
    role === 'student'   ? STUDENT_TABS :
    role === 'institute' ? INSTITUTE_TABS :
    PARENT_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100 safe-area-pb">
      <div className="flex items-stretch">
        {tabs.map(tab => {
          const active =
            tab.href === '/parent' || tab.href === '/student' || tab.href === '/institute'
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <tab.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-medium leading-none">{tab.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
