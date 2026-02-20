import { api } from './axios'

export interface AlertRule {
  id: string
  name: string
  ruleType: RuleType
  config: Record<string, any>
  appliesTo: 'ALL_DEVICES' | 'SPECIFIC_DEVICE'
  deviceId?: string
  severity: Severity
  active: boolean
  notifyPush: boolean
  notifyEmail: boolean
  notifySms: boolean
  cooldownMinutes: number
  lastTriggered?: string
  createdAt: string
}

export interface AlertItem {
  id: string
  ruleType: string
  severity: Severity
  title: string
  message: string
  metadata: Record<string, any>
  read: boolean
  dismissed: boolean
  triggeredAt: string
  triggeredAtRelative: string
  deviceId?: string
  deviceName?: string
}

export interface AlertsPage {
  alerts: AlertItem[]
  totalCount: number
  unreadCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type RuleType =
  | 'SCREEN_TIME_EXCEEDED'
  | 'APP_USAGE_EXCEEDED'
  | 'CATEGORY_USAGE_EXCEEDED'
  | 'LATE_NIGHT_USAGE'
  | 'BLOCKED_APP_ATTEMPT'
  | 'FOCUS_MODE_BROKEN'

export const alertsApi = {
  // Rules
  getRules: () =>
    api.get<AlertRule[]>('/alerts/rules').then(r => r.data),

  createRule: (data: Omit<AlertRule, 'id' | 'createdAt' | 'lastTriggered'>) =>
    api.post<AlertRule>('/alerts/rules', data).then(r => r.data),

  toggleRule: (id: string) =>
    api.patch<AlertRule>(`/alerts/rules/${id}/toggle`).then(r => r.data),

  deleteRule: (id: string) =>
    api.delete(`/alerts/rules/${id}`),

  // Alerts feed
  getAlerts: (page = 0, size = 20) =>
    api.get<AlertsPage>(`/alerts?page=${page}&size=${size}`).then(r => r.data),

  markRead: (id: string) =>
    api.patch(`/alerts/${id}/read`),

  markAllRead: () =>
    api.post('/alerts/read-all'),

  dismiss: (id: string) =>
    api.patch(`/alerts/${id}/dismiss`),
}
