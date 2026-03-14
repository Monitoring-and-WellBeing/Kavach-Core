import { api } from './axios'

export interface Device {
  id: string
  name: string
  type: 'DESKTOP' | 'LAPTOP' | 'TABLET' | 'MOBILE'
  status: 'ONLINE' | 'OFFLINE' | 'PAUSED' | 'FOCUS_MODE'
  osVersion: string | null
  agentVersion: string | null
  hostname: string | null
  lastSeen: string | null
  assignedTo: string | null
  tenantId: string
  screenTimeToday: number
  lastSeenRelative: string
}

export const devicesApi = {
  list: () =>
    api.get<Device[]>('/devices').then(r => r.data),

  get: (id: string) =>
    api.get<Device>(`/devices/${id}`).then(r => r.data),

  link: (codeOrData: string | { deviceCode: string; deviceName?: string }, deviceName?: string, assignedTo?: string) => {
    if (typeof codeOrData === 'string') {
      // Legacy format: link(code, deviceName, assignedTo)
      return api.post<Device>('/devices/link', { code: codeOrData, deviceName, assignedTo }).then(r => r.data)
    } else {
      // New format: link({ deviceCode, deviceName })
      return api.post<Device>('/devices/link', { deviceCode: codeOrData.deviceCode, deviceName: codeOrData.deviceName, assignedTo }).then(r => r.data)
    }
  },

  update: (id: string, data: { name?: string; assignedTo?: string }) =>
    api.put<Device>(`/devices/${id}`, data).then(r => r.data),

  pause: (id: string) =>
    api.post<Device>(`/devices/${id}/pause`).then(r => r.data),

  resume: (id: string) =>
    api.post<Device>(`/devices/${id}/resume`).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/devices/${id}`),
}
