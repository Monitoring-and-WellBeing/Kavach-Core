/**
 * UsageCollectorTask — background task that harvests Android UsageStats every
 * 30 minutes and ships them to /api/v1/activity/mobile-usage.
 *
 * Falls back to the OfflineQueue when the network is unavailable so no data
 * is lost while the phone is in a dead-zone.
 *
 * Requires:
 *  • expo-background-fetch  (already in package.json)
 *  • expo-task-manager      (already in package.json)
 *  • PACKAGE_USAGE_STATS permission granted by the user
 *  • Native UsageStatsManager module (custom dev-build / bare workflow)
 */
import * as TaskManager from 'expo-task-manager'
import * as BackgroundFetch from 'expo-background-fetch'
import { NativeModules } from 'react-native'
import { api } from '../lib/axios'
import { AuthStorage } from '../lib/auth'
import { OfflineQueue } from '../lib/OfflineQueue'

export const USAGE_COLLECTOR_TASK = 'KAVACH_USAGE_COLLECTOR'

/** How often (seconds) the OS should wake us up — Android minimum is ~15 min */
const COLLECTION_INTERVAL_SECONDS = 30 * 60 // 30 minutes

// ── Task definition (must run at module-load time, before any registerTaskAsync)
TaskManager.defineTask(USAGE_COLLECTOR_TASK, async () => {
  try {
    // Only run if the student is authenticated and device is paired
    const token = await AuthStorage.getAccessToken()
    if (!token) return BackgroundFetch.BackgroundFetchResult.NoData

    const deviceId = await AuthStorage.getDeviceId()
    if (!deviceId) return BackgroundFetch.BackgroundFetchResult.NoData

    const { UsageStatsManager } = NativeModules
    if (!UsageStatsManager?.queryUsageStats) {
      // Native module not available in this build (e.g. Expo Go)
      return BackgroundFetch.BackgroundFetchResult.NoData
    }

    const endTime = Date.now()
    const startTime = endTime - COLLECTION_INTERVAL_SECONDS * 1000

    // Returns: [{ packageName, appName?, totalTimeInForeground, lastTimeUsed }]
    const stats: Array<{
      packageName: string
      appName?: string
      totalTimeInForeground: number
      lastTimeUsed: number
    }> = await UsageStatsManager.queryUsageStats(startTime, endTime)

    // Filter out zero-usage entries to keep payloads small
    const active = stats.filter((s) => s.totalTimeInForeground > 0)
    if (active.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData

    const payload = {
      deviceId,
      collectedAt: new Date().toISOString(),
      periodStart: new Date(startTime).toISOString(),
      periodEnd: new Date(endTime).toISOString(),
      appUsage: active.map((s) => ({
        packageName: s.packageName,
        appName: s.appName ?? s.packageName,
        durationMs: s.totalTimeInForeground,
        lastUsed: new Date(s.lastTimeUsed).toISOString(),
      })),
    }

    try {
      await api.post('/activity/mobile-usage', payload)
    } catch {
      // Device offline — persist and retry later
      await OfflineQueue.enqueue('mobile-usage', payload)
    }

    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

// ── Registration helper ────────────────────────────────────────────────────────

/**
 * Register the usage-collector background task.
 * Safe to call multiple times — expo-background-fetch is idempotent.
 */
export async function registerUsageCollector(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(USAGE_COLLECTOR_TASK)
  if (isRegistered) return

  await BackgroundFetch.registerTaskAsync(USAGE_COLLECTOR_TASK, {
    minimumInterval: COLLECTION_INTERVAL_SECONDS,
    stopOnTerminate: false,
    startOnBoot: true,
  })
}

/** Remove the task (call on logout / permission revoked). */
export async function unregisterUsageCollector(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(USAGE_COLLECTOR_TASK)
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(USAGE_COLLECTOR_TASK)
  }
}
