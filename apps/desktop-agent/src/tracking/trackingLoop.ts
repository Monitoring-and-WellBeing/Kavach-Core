import { getActiveWindow, recordWindow, flushCurrentSession, UsageSession } from './tracker'
import { syncSessions } from '../sync/syncer'
import { sendHeartbeat } from '../sync/deviceRegistration'

const POLL_INTERVAL_MS = 5000   // poll active window every 5 seconds
const SYNC_INTERVAL_MS = 30000  // sync to backend every 30 seconds

let pollTimer: NodeJS.Timeout | null = null
let syncTimer: NodeJS.Timeout | null = null
let sessionQueue: UsageSession[] = []
let isTracking = false

export function startTrackingLoop(): void {
  if (isTracking) return
  isTracking = true

  console.log('[tracking] Starting tracking loop')

  // Poll active window every 5 seconds
  pollTimer = setInterval(async () => {
    const window = await getActiveWindow()
    const completed = recordWindow(window)
    sessionQueue.push(...completed)
  }, POLL_INTERVAL_MS)

  // Sync to backend every 30 seconds
  syncTimer = setInterval(async () => {
    // Flush current in-progress session (partial — it continues after)
    const partial = flushCurrentSession()
    if (partial) sessionQueue.push(partial)

    if (sessionQueue.length > 0) {
      const toSync = [...sessionQueue]
      sessionQueue = []
      await syncSessions(toSync)
    }

    // Send heartbeat
    await sendHeartbeat()
  }, SYNC_INTERVAL_MS)
}

export function stopTrackingLoop(): void {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null }
  isTracking = false

  // Final sync of remaining queue
  const partial = flushCurrentSession()
  if (partial) sessionQueue.push(partial)
  if (sessionQueue.length > 0) {
    syncSessions(sessionQueue).catch(() => {})
    sessionQueue = []
  }

  console.log('[tracking] Tracking loop stopped')
}

export function isTrackingActive(): boolean {
  return isTracking
}
