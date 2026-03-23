import { rest } from 'msw'
import { mockParentDashboard, mockDevice, mockDevice2 } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const dashboardHandlers = [
  rest.get(`${BASE}/dashboard/parent`, (req, res, ctx) => {
    return res(ctx.json({
      stats: {
        totalScreenTimeSeconds: 14400,
        totalScreenTimeFormatted: '4h',
        activeDevices: 1,
        totalDevices: 2,
        focusSessionsToday: 2,
        blockedAttemptsToday: 5,
        unreadAlerts: 3,
      },
      devices: [
        {
          id: mockDevice.id,
          name: mockDevice.name,
          assignedTo: 'Arjun',
          status: 'ONLINE',
          lastSeen: new Date().toISOString(),
          screenTimeSeconds: 10800,
          screenTimeFormatted: '3h',
          topApp: 'Chrome',
          inFocus: false,
          agentVersion: '1.0.0',
        },
        {
          id: mockDevice2.id,
          name: mockDevice2.name,
          assignedTo: 'Priya',
          status: 'OFFLINE',
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
          screenTimeSeconds: 3600,
          screenTimeFormatted: '1h',
          topApp: 'YouTube',
          inFocus: false,
          agentVersion: null,
        },
      ],
      recentAlerts: [],
    }))
  }),

  rest.get(`${BASE}/dashboard/student`, (req, res, ctx) => {
    return res(ctx.json({
      deviceLinked: true,
      deviceId: mockDevice.id,
      deviceName: mockDevice.name,
      focusScore: 72,
      streak: 5,
      stats: {
        screenTimeSeconds: 7200,
        screenTimeFormatted: '2h',
        focusMinutesToday: 50,
        focusSessionsToday: 2,
      },
      topApps: [
        { appName: 'Chrome', category: 'PRODUCTIVITY', durationSeconds: 3600 },
        { appName: 'VS Code', category: 'EDUCATION', durationSeconds: 1800 },
      ],
      categories: [
        { category: 'EDUCATION', durationSeconds: 1800 },
        { category: 'ENTERTAINMENT', durationSeconds: 3600 },
      ],
      weeklyData: [
        { date: '2024-01-01', dayLabel: 'Mon', screenTimeSeconds: 3600 },
        { date: '2024-01-02', dayLabel: 'Tue', screenTimeSeconds: 5400 },
        { date: '2024-01-03', dayLabel: 'Wed', screenTimeSeconds: 2700 },
        { date: '2024-01-04', dayLabel: 'Thu', screenTimeSeconds: 4500 },
        { date: '2024-01-05', dayLabel: 'Fri', screenTimeSeconds: 6000 },
        { date: '2024-01-06', dayLabel: 'Sat', screenTimeSeconds: 1800 },
        { date: '2024-01-07', dayLabel: 'Sun', screenTimeSeconds: 3000 },
      ],
      activeFocusSession: null,
    }))
  }),

  rest.get(`${BASE}/dashboard/institute`, (req, res, ctx) => {
    return res(ctx.json({
      stats: {
        totalDevices: 10,
        onlineDevices: 7,
        offlineDevices: 2,
        pausedDevices: 1,
        focusDevices: 1,
        totalScreenTimeSeconds: 86400,
        totalScreenTimeFormatted: '24h',
        blockedAttemptsToday: 23,
        complianceScore: 85,
        unreadAlerts: 5,
      },
      devices: [],
      topApps: [
        { appName: 'Chrome', category: 'PRODUCTIVITY', durationSeconds: 14400 },
        { appName: 'YouTube', category: 'ENTERTAINMENT', durationSeconds: 7200 },
      ],
    }))
  }),
]
