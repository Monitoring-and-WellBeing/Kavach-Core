import { api } from './axios'

export interface InstituteStats {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  pausedDevices: number
  focusDevices: number
  totalScreenTimeSeconds: number
  totalScreenTimeFormatted: string
  blockedAttemptsToday: number
  complianceScore: number
  unreadAlerts: number
}

export interface InstituteDevice {
  id: string
  name: string
  assignedTo: string | null
  status: 'ONLINE' | 'OFFLINE' | 'PAUSED' | 'FOCUS_MODE'
  lastSeen: string | null
  screenTimeSeconds: number
  screenTimeFormatted: string
  topApp: string | null
  blockedAttempts: number
  inFocus: boolean
  osVersion: string | null
  agentVersion: string | null
}

export interface TopApp {
  appName: string
  category: string
  durationSeconds: number
}

export interface InstituteDashboard {
  stats: InstituteStats
  devices: InstituteDevice[]
  topApps: TopApp[]
}

export const instituteDashboardApi = {
  get: () =>
    api.get<InstituteDashboard>('/dashboard/institute').then(r => r.data),

  bulkAction: (action: 'PAUSE' | 'RESUME' | 'FOCUS',
               deviceIds: string[],
               focusDuration?: number) =>
    api.post('/devices/bulk-action', { action, deviceIds, focusDuration })
       .then(r => r.data),
}
