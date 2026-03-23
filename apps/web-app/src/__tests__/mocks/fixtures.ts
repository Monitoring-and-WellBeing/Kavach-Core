// Shared mock data used across all handlers and tests

export const mockTenant = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Demo Family',
}

export const mockUser = {
  id: 'user-001',
  email: 'parent@demo.com',
  role: 'PARENT',
  tenantId: mockTenant.id,
}

export const mockTokens = {
  accessToken: 'mock.jwt.access.token',
  refreshToken: 'mock.jwt.refresh.token',
  user: mockUser,
}

export const mockDevice = {
  id: 'device-001',
  name: "Arjun's Laptop",
  deviceType: 'WINDOWS',
  status: 'ONLINE',
  screenTimeToday: 180,        // minutes
  topApp: 'Chrome',
  tenantId: mockTenant.id,
  active: true,
}

export const mockDevice2 = {
  id: 'device-002',
  name: "Priya's Phone",
  deviceType: 'ANDROID',
  status: 'OFFLINE',
  screenTimeToday: 60,
  topApp: 'YouTube',
  tenantId: mockTenant.id,
  active: true,
}

export const mockParentDashboard = {
  totalScreenTime: 240,
  activeDevices: 1,
  focusSessionsToday: 2,
  blockedAttempts: 5,
  devices: [mockDevice, mockDevice2],
  recentAlerts: [],
}

export const mockSubscription = {
  planCode: 'STANDARD',
  planName: 'Standard',
  planType: 'B2C',
  status: 'TRIAL',
  isTrial: true,
  daysRemaining: 28,
  deviceCount: 2,
  maxDevices: 4,
  maxDevicesLabel: '4 devices',
  deviceUsagePercent: 50,
  nearLimit: false,
  atLimit: false,
  features: ['device_monitoring', 'app_blocking', 'ai_insights', 'goals'],
  monthlyTotal: 29900,
  monthlyTotalFormatted: '₹299/month',
}

export const mockPlans = [
  {
    id: 'plan-001',
    code: 'BASIC',
    name: 'Basic',
    planType: 'B2C',
    priceFlat: 14900,
    priceFormatted: '₹149/month',
    maxDevices: 3,
    maxDevicesLabel: '3 devices',
    features: ['device_monitoring', 'app_blocking'],
    current: false,
  },
  {
    id: 'plan-002',
    code: 'STANDARD',
    name: 'Standard',
    planType: 'B2C',
    priceFlat: 29900,
    priceFormatted: '₹299/month',
    maxDevices: 4,
    maxDevicesLabel: '4 devices',
    features: ['device_monitoring', 'app_blocking', 'ai_insights', 'goals'],
    current: true,
  },
]

export const mockGoals = [
  {
    id: 'goal-001',
    deviceId: 'device-001',
    type: 'SCREEN_TIME_LIMIT',
    title: 'Limit daily screen time',
    targetValue: 180,
    currentValue: 120,
    unit: 'minutes',
    active: true,
    progressPercent: 66.7,
  },
]

export const mockAlertRules = [
  {
    id: 'rule-001',
    name: 'Screen Time Exceeded',
    type: 'SCREEN_TIME',
    threshold: 240,
    severity: 'MEDIUM',
    active: true,
    deviceId: 'device-001',
  },
]

export const mockBlockingRules = [
  {
    id: 'block-001',
    type: 'APP',
    target: 'YouTube',
    active: true,
    schedule: null,
    deviceId: 'device-001',
  },
]

export const mockFocusSession = {
  id: 'focus-001',
  deviceId: 'device-001',
  deviceName: "Arjun's Laptop",
  initiatedRole: 'STUDENT' as const,
  title: '25-minute Focus',
  durationMinutes: 25,
  startedAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
  status: 'ACTIVE' as const,
  remainingSeconds: 25 * 60,
  progressPercent: 0,
}

export const mockBadges = [
  {
    id: 'badge-001',
    code: 'FIRST_FOCUS',
    name: 'First Focus',
    description: 'Completed your first focus session',
    icon: '🎯',
    category: 'FOCUS' as const,
    tier: 'BRONZE' as const,
    xpReward: 50,
    earned: true,
    earnedAt: new Date().toISOString(),
  },
]

export const mockInsight = {
  deviceId: 'device-001',
  weekSummary: 'Arjun spent 18 hours on screen this week.',
  riskLevel: 'LOW',
  positiveTags: ['consistent_focus', 'early_bedtime'],
  insights: [
    {
      title: 'Good focus habits',
      description: '3 focus sessions completed this week',
      type: 'POSITIVE',
    },
  ],
  generatedAt: new Date().toISOString(),
}
