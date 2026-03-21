import { UsageSession } from '../tracking/tracker'
import { bufferSessions, readBuffer, clearBuffer } from '../offline-buffer/buffer'
import { loadConfig } from '../auth/config'
import { logger } from '../logger'

export interface ActivityLogPayload {
  deviceId: string
  logs: Array<{
    appName: string
    processName: string
    windowTitle: string
    category: string
    durationSeconds: number
    startedAt: string
    endedAt: string
    isBlocked: boolean
  }>
}

// Backpressure: prevent concurrent syncs
let isSyncing = false

// Offline reconnect logic: track failures and adjust polling
let failureCount = 0
let lastSyncTime = 0

const MAX_BUFFER_SIZE = 500 // entries
const NORMAL_SYNC_INTERVAL = 30000 // 30 seconds
const BACKOFF_SYNC_INTERVAL = 300000 // 5 minutes after 3 failures

export async function syncSessions(sessions: UsageSession[]): Promise<boolean> {
  const config = await loadConfig()

  if (!config.deviceLinked || !config.deviceId) {
    logger.info('[syncer] Device not linked, skipping sync')
    return false
  }

  if (sessions.length === 0) return true

  // Guard: prevent concurrent syncs
  if (isSyncing) {
    logger.debug('[syncer] Sync already in progress, skipping')
    return false
  }

  isSyncing = true

  try {
    const payload: ActivityLogPayload = {
      deviceId: config.deviceId,
      logs: sessions.map(s => ({
        appName: s.appName,
        processName: s.processName,
        windowTitle: s.windowTitle || '',
        category: s.category,
        durationSeconds: s.durationSeconds,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt.toISOString(),
        isBlocked: false, // rule engine will set this in Feature 08
      })),
    }

    const response = await fetch(
      `${config.apiUrl}/api/v1/activity`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // Success: reset failure count and flush buffer
    failureCount = 0
    lastSyncTime = Date.now()
    logger.info('[syncer] Sync succeeded, resetting failure count')

    // After successful sync, flush the offline buffer too
    await flushOfflineBuffer(config.deviceId, config.apiUrl)

    return true
  } catch (err: any) {
    // Check if it's a network error (ECONNREFUSED, ENOTFOUND, ETIMEDOUT)
    const isNetworkError = err.message?.includes('ECONNREFUSED') ||
                          err.message?.includes('ENOTFOUND') ||
                          err.message?.includes('ETIMEDOUT') ||
                          err.message?.includes('Failed to fetch') ||
                          err.name === 'AbortError'

    if (isNetworkError) {
      failureCount++
      logger.warn('[syncer] Network error, failure count', failureCount)

      if (failureCount >= 3) {
        logger.warn('[syncer] 3+ consecutive failures, will use backoff interval (5 min)')
      }
    }

    logger.error('[syncer] Sync failed, buffering', String(err))
    
    // Keep buffer intact — don't clear on failure
    await bufferSessions(config.deviceId, sessions)
    
    return false
  } finally {
    isSyncing = false
  }
}

// Get current sync interval based on failure count
export function getSyncInterval(): number {
  return failureCount >= 3 ? BACKOFF_SYNC_INTERVAL : NORMAL_SYNC_INTERVAL
}

// Reset failure count (called when connection is restored)
export function resetFailureCount(): void {
  if (failureCount > 0) {
    logger.info('[syncer] Connection restored, resetting failure count')
    failureCount = 0
  }
}

async function flushOfflineBuffer(deviceId: string, apiUrl: string): Promise<void> {
  const buffered = await readBuffer()
  if (buffered.length === 0) return

  // Enforce buffer size limit: drop oldest entries if exceeded
  const logsToFlush = buffered.length > MAX_BUFFER_SIZE
    ? buffered.slice(-MAX_BUFFER_SIZE)
    : buffered

  if (buffered.length > MAX_BUFFER_SIZE) {
    logger.warn(`[syncer] Buffer exceeded MAX_BUFFER_SIZE (${MAX_BUFFER_SIZE}), dropping ${buffered.length - MAX_BUFFER_SIZE} oldest entries`)
  }

  logger.info(`[syncer] Flushing ${logsToFlush.length} buffered logs`)

  const payload: ActivityLogPayload = {
    deviceId,
    logs: logsToFlush.map(b => ({
      appName: b.session.appName,
      processName: b.session.processName,
      windowTitle: b.session.windowTitle || '',
      category: b.session.category,
      durationSeconds: b.session.durationSeconds,
      startedAt: new Date(b.session.startedAt).toISOString(),
      endedAt: new Date(b.session.endedAt).toISOString(),
      isBlocked: false,
    })),
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })
    if (response.ok) {
      await clearBuffer()
      resetFailureCount() // Connection restored
      logger.info('[syncer] Buffer flushed successfully, connection restored')
    }
  } catch {
    // Leave buffer intact — try again next cycle
    logger.debug('[syncer] Buffer flush failed, will retry next cycle')
  }
}
