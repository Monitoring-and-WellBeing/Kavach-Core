import { api } from './axios'

export interface DashboardStats {
  totalScreenTimeSeconds: number
  totalScreenTimeFormatted: string
  activeDevices: number
  totalDevices: number
  focusSessionsToday: number
  blockedAttemptsToday: number
  unreadAlerts: number
}

export interface DeviceSummary {
  id: string
  name: string
  assignedTo: string | null
  status: 'ONLINE' | 'OFFLINE' | 'PAUSED' | 'FOCUS_MODE'
  lastSeen: string | null
  screenTimeSeconds: number
  screenTimeFormatted: string
  topApp: string | null
  inFocus: boolean
  agentVersion: string | null
}

export interface DashboardAlert {
  id: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ruleType: string
  read: boolean
  triggeredAt: string
}

export interface ParentDashboard {
  stats: DashboardStats
  devices: DeviceSummary[]
  recentAlerts: DashboardAlert[]
}

export const dashboardApi = {
  getParent: () =>
    api.get<ParentDashboard>('/dashboard/parent').then(r => r.data),
}
