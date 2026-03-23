import { api } from './axios'

export interface BlockRule {
  id: string
  name: string
  ruleType: 'APP' | 'CATEGORY' | 'WEBSITE' | 'KEYWORD'
  target: string
  appliesTo: 'ALL_DEVICES' | 'SPECIFIC_DEVICE'
  deviceId?: string
  scheduleEnabled: boolean
  scheduleDays: string
  scheduleStart?: string
  scheduleEnd?: string
  showMessage: boolean
  blockMessage: string
  active: boolean
  createdAt: string
}

export const blockingApi = {
  getRules: () =>
    api.get<BlockRule[]>('/blocking/rules').then(r => r.data),

  createRule: (data: Omit<BlockRule, 'id' | 'createdAt'>) =>
    api.post<BlockRule>('/blocking/rules', data).then(r => r.data),

  toggleRule: (id: string) =>
    api.patch<BlockRule>(`/blocking/rules/${id}/toggle`).then(r => r.data),

  updateRule: (id: string, patch: Partial<BlockRule>) =>
    api.put<BlockRule>(`/blocking/rules/${id}`, patch).then(r => r.data),

  deleteRule: (id: string) =>
    api.delete(`/blocking/rules/${id}`),
}
