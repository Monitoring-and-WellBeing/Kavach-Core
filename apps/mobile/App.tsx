import React, { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'

// ── Background task registrations (must import at module level) ────────────────
import { registerUsageCollector } from './src/tasks/UsageCollectorTask'
import { startLocationTracking } from './src/tasks/LocationTask'
import { loadAndStartGeoFences } from './src/tasks/GeoFenceTask'
import { registerAppWatcher } from './src/tasks/AppWatcherTask'
import { requestUsageStatsPermission } from './src/permissions/UsageStatsPermission'
import { RuleSync } from './src/enforcement/RuleSync'

// ── Notification handler — show alerts while the app is in the foreground ────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ── Bootstrap monitoring stack (Android only) ─────────────────────────────────
async function bootstrapMonitoring(deviceId?: string) {
  if (Platform.OS !== 'android') return

  // 1. GPS — request permission then start background tracking
  await startLocationTracking()

  // 2. Geo-fences — load tenant zones from backend and start monitoring
  await loadAndStartGeoFences()

  // 3. Usage stats — prompt for permission then register background collector
  const hasUsagePerm = await requestUsageStatsPermission()
  if (hasUsagePerm) {
    await registerUsageCollector()
    await registerAppWatcher(deviceId)
  }
}

// ── Root component with enforcement sync ─────────────────────────────────────
function AppWithSync() {
  const { user } = useAuth()

  // Start / stop RuleSync whenever the logged-in user (and their deviceId) changes
  useEffect(() => {
    if (user?.deviceId) {
      RuleSync.start(user.deviceId).catch(() => {
        // Non-fatal — app keeps working with cached or empty rules
      })
    }

    return () => {
      RuleSync.stop()
    }
  }, [user?.deviceId])

  // Handle silent push notifications sent by the backend when a rule changes.
  // This gives near-instant enforcement (< 1 s) rather than waiting for the 30 s poll.
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data
      if (data?.type === 'RULE_UPDATE' && user?.deviceId) {
        RuleSync.triggerSync().catch(() => {})
      }
    })
    return () => sub.remove()
  }, [user?.deviceId])

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  )
}

export default function App() {
  useEffect(() => {
    // Notification permissions
    Notifications.requestPermissionsAsync().catch(() => {
      // Permission denied — haptics still work; notifications silently fail
    })

    // Start the monitoring stack once on mount
    bootstrapMonitoring().catch(() => {
      // Non-fatal — app still works without monitoring
    })

    // Re-sync geo-fences whenever the app comes to the foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadAndStartGeoFences().catch(() => {})
      }
    })

    return () => sub.remove()
  }, [])

  return (
    <AuthProvider>
      <AppWithSync />
    </AuthProvider>
  )
}
