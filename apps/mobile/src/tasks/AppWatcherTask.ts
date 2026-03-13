/**
 * AppWatcherTask — polls the foreground app every ~15 seconds.
 *
 * Now rule-aware via RuleSync:
 *   • BLOCK_APP rules → red "blocked" overlay + violation report
 *   • Focus mode      → blue "focus mode" overlay + violation report
 *   • TIME_LIMIT      → amber overlay at limit / notification at warning
 *   • Usage buffer    → flushed to /enforcement/usage every ~5 min
 *
 * Requires:
 *   • PACKAGE_USAGE_STATS permission
 *   • Native UsageStatsManager + OverlayModule in the dev-build
 */
import * as TaskManager from 'expo-task-manager'
import * as BackgroundFetch from 'expo-background-fetch'
import * as Notifications from 'expo-notifications'
import { NativeModules, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { RuleSync, categorizeAndroid, type BlockingRule, type TimeLimitEntry } from '../enforcement/RuleSync'
import { api } from '../lib/axios'

export const APP_WATCHER_TASK = 'KAVACH_APP_WATCHER'

const DEVICE_ID_KEY    = 'kavach_device_id'
const CYCLE_COUNT_KEY  = 'kavach_watcher_cycles'
const FLUSH_EVERY      = 20  // cycles before flushing usage (~5 min at 15 s/cycle)

/** Per-package usage accumulator (package → seconds in this flush window). */
const usageBuffer = new Map<string, number>()

// ── Task definition ───────────────────────────────────────────────────────────

TaskManager.defineTask(APP_WATCHER_TASK, async () => {
  try {
    if (Platform.OS !== 'android') return BackgroundFetch.BackgroundFetchResult.NoData

    const { UsageStatsManager } = NativeModules
    if (!UsageStatsManager?.getForegroundApp) {
      return BackgroundFetch.BackgroundFetchResult.NoData
    }

    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY)
    if (!deviceId) return BackgroundFetch.BackgroundFetchResult.NoData

    const currentApp: string | null = await UsageStatsManager.getForegroundApp()
    if (!currentApp) return BackgroundFetch.BackgroundFetchResult.NoData

    // Accumulate usage for this interval (15 s per cycle)
    usageBuffer.set(currentApp, (usageBuffer.get(currentApp) ?? 0) + 15)

    // ── Enforcement checks (in priority order) ───────────────────────────

    // 1. Is the app explicitly blocked by a blocking rule?
    const blockedRule = RuleSync.isAppBlocked(currentApp)
    if (blockedRule) {
      await showBlockedOverlay(currentApp, blockedRule)
      await reportViolation(deviceId, currentApp, blockedRule.id, 'APP_BLOCKED')
      return BackgroundFetch.BackgroundFetchResult.NewData
    }

    // 2. Is focus mode active and this app not on the whitelist?
    if (RuleSync.isFocusModeActive() && !RuleSync.isWhitelistedDuringFocus(currentApp)) {
      await showFocusModeOverlay(currentApp)
      await reportViolation(deviceId, currentApp, 'focus-mode', 'FOCUS_VIOLATION')
      return BackgroundFetch.BackgroundFetchResult.NewData
    }

    // 3. Time limit reached or approaching?
    const timeLimit = RuleSync.getTimeLimitForApp(currentApp)
    if (timeLimit?.limitReached) {
      await showTimeLimitOverlay(currentApp, timeLimit)
      await reportViolation(deviceId, currentApp, timeLimit.ruleId, 'TIME_LIMIT_REACHED')
    } else if (timeLimit?.warningThreshold) {
      const remainingMins = Math.ceil(timeLimit.remainingSeconds / 60)
      await showTimeLimitWarning(remainingMins)
    }

    // ── Periodic usage flush ─────────────────────────────────────────────

    const raw = await AsyncStorage.getItem(CYCLE_COUNT_KEY)
    const cycles = (parseInt(raw ?? '0', 10) + 1)
    await AsyncStorage.setItem(CYCLE_COUNT_KEY, String(cycles))

    if (cycles % FLUSH_EVERY === 0) {
      await flushUsageBuffer(deviceId)
    }

    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

// ── Overlay helpers ───────────────────────────────────────────────────────────

async function showBlockedOverlay(
  packageName: string,
  rule: BlockingRule
): Promise<void> {
  const { OverlayModule } = NativeModules
  if (!OverlayModule?.show) return
  await OverlayModule.show({
    title: `${packageName} is blocked`,
    message: rule.blockMessage
      ?? 'Your parent has restricted this app. Focus on what matters! 📚',
    buttonText: 'Got it',
    color: '#EF4444',   // red for blocked
  })
}

async function showFocusModeOverlay(packageName: string): Promise<void> {
  const { OverlayModule } = NativeModules
  if (!OverlayModule?.show) return
  await OverlayModule.show({
    title: '🎯 Focus Mode is ON',
    message: 'This app is not available during your focus session. Keep going!',
    buttonText: 'Back to focus',
    color: '#2563EB',   // blue for focus mode
  })
}

async function showTimeLimitOverlay(
  packageName: string,
  limit: TimeLimitEntry
): Promise<void> {
  const { OverlayModule } = NativeModules
  if (!OverlayModule?.show) return
  await OverlayModule.show({
    title: 'Daily Limit Reached',
    message: `You've used your daily allowance for ${limit.appCategory}. Come back tomorrow! 🌅`,
    buttonText: 'Okay',
    color: '#F59E0B',   // amber for time limit
  })
}

async function showTimeLimitWarning(remainingMins: number): Promise<void> {
  // Use a local notification (less intrusive than a full overlay)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏱ Time Limit Warning — KAVACH',
      body: `${remainingMins} minute${remainingMins !== 1 ? 's' : ''} remaining for this app today.`,
    },
    trigger: null,  // immediate
  })
}

// ── Reporting helpers ─────────────────────────────────────────────────────────

async function reportViolation(
  deviceId: string,
  appName: string,
  ruleId: string,
  action: string
): Promise<void> {
  api.post('/enforcement/events', {
    deviceId,
    processName: appName,
    ruleId,
    action,
    platform: 'ANDROID',
    timestamp: new Date().toISOString(),
  }).catch(() => {})  // fire and forget — never block enforcement
}

async function flushUsageBuffer(deviceId: string): Promise<void> {
  const entries = Array.from(usageBuffer.entries())
  usageBuffer.clear()

  for (const [packageName, seconds] of entries) {
    if (seconds < 10) continue  // ignore < 10 s — noise

    api.post('/enforcement/usage', {
      deviceId,
      packageName,
      appCategory: categorizeAndroid(packageName),
      durationSeconds: seconds,
      platform: 'ANDROID',
    }).catch(() => {})
  }
}

// ── Registration helpers ──────────────────────────────────────────────────────

/**
 * Register the background watcher task.
 * Persists the deviceId so the task can look it up without the auth context.
 */
export async function registerAppWatcher(deviceId?: string): Promise<void> {
  if (deviceId) {
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(APP_WATCHER_TASK)
  if (isRegistered) return

  await BackgroundFetch.registerTaskAsync(APP_WATCHER_TASK, {
    minimumInterval: 15,    // Android enforces ~15 min in practice
    stopOnTerminate: false,
    startOnBoot: true,
  })
}

/** Unregister the task on logout. */
export async function unregisterAppWatcher(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(APP_WATCHER_TASK)
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(APP_WATCHER_TASK)
  }
}
