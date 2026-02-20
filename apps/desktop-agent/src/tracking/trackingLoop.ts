import { getActiveWindow, recordWindow, flushCurrentSession, UsageSession } from './tracker'
import { syncSessions } from '../sync/syncer'
import { sendHeartbeat } from '../sync/deviceRegistration'
import { shouldBlock, refreshBlockRules } from '../blocking/blockingEngine'
import { killProcess, showBlockNotification } from '../blocking/processKiller'
import { reportViolation } from '../blocking/violationReporter'

const POLL_INTERVAL_MS   = 5000
const SYNC_INTERVAL_MS   = 30000
const RULES_REFRESH_MS   = 60000  // refresh block rules every 60 seconds

let pollTimer: NodeJS.Timeout | null = null
let syncTimer: NodeJS.Timeout | null = null
let rulesTimer: NodeJS.Timeout | null = null
let sessionQueue: UsageSession[] = []
let isTracking = false

// Throttle — don't re-block same app within 10 seconds
const recentlyBlocked = new Map<string, number>()

export function startTrackingLoop(): void {
  if (isTracking) return
  isTracking = true

  console.log('[tracking] Starting tracking loop with blocking enforcement')

  // Initial rule fetch
  refreshBlockRules()

  // Poll active window every 5 seconds
  pollTimer = setInterval(async () => {
    const window = await getActiveWindow()

    if (window) {
      // ── BLOCKING CHECK ──────────────────────────────────────────────────────
      const lastBlocked = recentlyBlocked.get(window.processName) || 0
      const cooldownPassed = Date.now() - lastBlocked > 10000

      if (cooldownPassed) {
        const { blocked, rule, reason } = shouldBlock(
          window.processName,
          window.windowTitle,
          window.category
        )

        if (blocked && rule) {
          console.log(`[blocker] Blocking ${window.processName}: ${reason}`)
          recentlyBlocked.set(window.processName, Date.now())

          // Kill the process
          await killProcess(window.processName)

          // Show notification to user
          await showBlockNotification(window.appName, rule.blockMessage)

          // Report violation to backend (async — don't await)
          reportViolation(
            window.appName,
            window.processName,
            window.windowTitle,
            window.category,
            rule
          )

          // Don't record this session — app was blocked
          return
        }
      }
      // ── END BLOCKING CHECK ──────────────────────────────────────────────────
    }

    // Normal session recording (only if not blocked)
    const completed = recordWindow(window)
    sessionQueue.push(...completed)
  }, POLL_INTERVAL_MS)

  // Sync to backend every 30 seconds
  syncTimer = setInterval(async () => {
    const partial = flushCurrentSession()
    if (partial) sessionQueue.push(partial)

    if (sessionQueue.length > 0) {
      const toSync = [...sessionQueue]
      sessionQueue = []
      await syncSessions(toSync)
    }

    await sendHeartbeat()
  }, SYNC_INTERVAL_MS)

  // Refresh block rules every 60 seconds
  rulesTimer = setInterval(refreshBlockRules, RULES_REFRESH_MS)
}

export function stopTrackingLoop(): void {
  if (pollTimer)  { clearInterval(pollTimer);  pollTimer  = null }
  if (syncTimer)  { clearInterval(syncTimer);  syncTimer  = null }
  if (rulesTimer) { clearInterval(rulesTimer); rulesTimer = null }
  isTracking = false

  const partial = flushCurrentSession()
  if (partial) sessionQueue.push(partial)
  if (sessionQueue.length > 0) {
    syncSessions(sessionQueue).catch(() => {})
    sessionQueue = []
  }
}

export function isTrackingActive(): boolean {
  return isTracking
}
