import { getActiveWindow, recordWindow, flushCurrentSession, UsageSession } from './tracker'
import { syncSessions, getSyncInterval } from '../sync/syncer'
import { sendHeartbeat } from '../sync/deviceRegistration'
import { shouldBlock, refreshBlockRules, trackAppTime } from '../blocking/blockingEngine'
import { killProcess, showBlockNotification } from '../blocking/processKiller'
import { reportViolation } from '../blocking/violationReporter'
import { pollFocusStatus, isFocusBlocked, getCurrentFocusStatus } from '../focus/focusEnforcer'

const POLL_INTERVAL_MS   = 5000
const RULES_REFRESH_MS   = 60000  // refresh block rules every 60 seconds

let pollTimer: NodeJS.Timeout | null = null
let syncTimer: NodeJS.Timeout | null = null
let rulesTimer: NodeJS.Timeout | null = null
let focusTimer: NodeJS.Timeout | null = null
let sessionQueue: UsageSession[] = []
let isTracking = false

// Throttle — don't re-block same app within 10 seconds
const recentlyBlocked = new Map<string, number>()

export interface TrackingLoopOptions {
  /**
   * When true, the legacy blocking engine (blockingEngine.ts) and legacy focus
   * enforcer are SKIPPED.  Set this to true when EnforcementEngine is active so
   * the two systems don't double-kill processes and double-report usage.
   *
   * Activity session recording (syncer.ts → /api/v1/activity) still runs in
   * both modes — it provides richer window-title data than EnforcementEngine's
   * process-level usage reporting.
   */
  skipLegacyEnforcement?: boolean
}

export function startTrackingLoop(opts: TrackingLoopOptions = {}): void {
  if (isTracking) return
  isTracking = true

  const skipEnforcement = opts.skipLegacyEnforcement ?? false

  if (skipEnforcement) {
    console.log('[tracking] Starting tracking loop — activity logging only (EnforcementEngine handles blocking)')
  } else {
    console.log('[tracking] Starting tracking loop with legacy blocking enforcement')
    // Only fetch rules and poll focus when the legacy engine is active
    refreshBlockRules()
    focusTimer = setInterval(pollFocusStatus, 15000)
    pollFocusStatus()
  }

  // Poll active window every 5 seconds
  pollTimer = setInterval(async () => {
    const window = await getActiveWindow()

    if (window) {
      // ── APP TIME TRACKING ────────────────────────────────────────────────────
      // Track app usage time (add 5 seconds for this poll interval)
      trackAppTime(window.processName)
      // ── END APP TIME TRACKING ────────────────────────────────────────────────

      // ── LEGACY BLOCKING CHECK (skipped when EnforcementEngine is active) ─────
      if (!skipEnforcement) {
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

            // Kill the process (wrapped in try/catch for graceful degradation)
            try {
              await killProcess(window.processName)
            } catch (err) {
              console.warn('[blocker] Process kill error handled gracefully', {
                processName: window.processName,
                error: String(err),
              })
              // Continue with notification and violation reporting even if kill fails
            }

            // Show notification to user (include time limit message if applicable)
            const message = rule.ruleType === 'APP_TIME_LIMIT' && rule.limitMinutes
              ? `Time limit reached for ${window.appName} (${rule.limitMinutes} min/day)`
              : rule.blockMessage
            await showBlockNotification(window.appName, message)

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

        // ── LEGACY FOCUS MODE ENFORCEMENT ─────────────────────────────────────
        if (window && isFocusBlocked(window.processName)) {
          const status = getCurrentFocusStatus()
          console.log(`[focus] Blocking non-whitelisted app during focus: ${window.processName}`)

          try {
            await killProcess(window.processName)
          } catch (err) {
            console.warn('[focus] Process kill error handled gracefully', {
              processName: window.processName,
              error: String(err),
            })
          }

          await showBlockNotification(
            window.appName,
            `Focus mode is active (${Math.floor((status.remainingSeconds || 0) / 60)} min remaining). Only study apps are allowed.`
          )
          return // Don't record this session
        }
        // ── END LEGACY FOCUS ENFORCEMENT ──────────────────────────────────────
      }
      // ── END LEGACY BLOCKING CHECK ─────────────────────────────────────────────
    }

    // Normal session recording (only if not blocked)
    const completed = recordWindow(window)
    sessionQueue.push(...completed)
  }, POLL_INTERVAL_MS)

  // Sync to backend with dynamic interval (30s normal, 5min after failures)
  const scheduleSync = () => {
    const interval = getSyncInterval()
    if (syncTimer) clearInterval(syncTimer)
    syncTimer = setInterval(async () => {
      const partial = flushCurrentSession()
      if (partial) sessionQueue.push(partial)

      if (sessionQueue.length > 0) {
        const toSync = [...sessionQueue]
        sessionQueue = []
        await syncSessions(toSync)
        // Reschedule with updated interval after sync
        scheduleSync()
      }

      await sendHeartbeat()
    }, interval)
  }
  scheduleSync()

  // Refresh block rules every 60 seconds — legacy enforcement only
  if (!skipEnforcement) {
    rulesTimer = setInterval(refreshBlockRules, RULES_REFRESH_MS)
  }
}

export function stopTrackingLoop(): void {
  if (pollTimer)  { clearInterval(pollTimer);  pollTimer  = null }
  if (syncTimer)  { clearInterval(syncTimer);  syncTimer  = null }
  if (rulesTimer) { clearInterval(rulesTimer); rulesTimer = null }
  if (focusTimer) { clearInterval(focusTimer); focusTimer = null }
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
