import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth.handlers'
import { deviceHandlers } from './handlers/device.handlers'
import { dashboardHandlers } from './handlers/dashboard.handlers'
import { reportsHandlers } from './handlers/reports.handlers'
import { subscriptionHandlers } from './handlers/subscription.handlers'
import { alertHandlers } from './handlers/alert.handlers'
import { blockingHandlers } from './handlers/blocking.handlers'
import { focusHandlers } from './handlers/focus.handlers'
import { goalHandlers } from './handlers/goal.handlers'
import { badgeHandlers } from './handlers/badge.handlers'
import { insightHandlers } from './handlers/insight.handlers'

export const server = setupServer(
  ...authHandlers,
  ...deviceHandlers,
  ...dashboardHandlers,
  ...reportsHandlers,
  ...subscriptionHandlers,
  ...alertHandlers,
  ...blockingHandlers,
  ...focusHandlers,
  ...goalHandlers,
  ...badgeHandlers,
  ...insightHandlers,
)
