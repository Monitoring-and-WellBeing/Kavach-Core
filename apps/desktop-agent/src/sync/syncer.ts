import { UsageSession } from '../tracking/tracker'
import { bufferSessions, readBuffer, clearBuffer } from '../offline-buffer/buffer'
import { loadConfig } from '../auth/config'

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

export async function syncSessions(sessions: UsageSession[]): Promise<boolean> {
  const config = await loadConfig()

  if (!config.deviceLinked || !config.deviceId) {
    console.log('[syncer] Device not linked, skipping sync')
    return false
  }

  if (sessions.length === 0) return true

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

  try {
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

    // After successful sync, flush the offline buffer too
    await flushOfflineBuffer(config.deviceId, config.apiUrl)

    return true
  } catch (err) {
    console.error('[syncer] Sync failed, buffering:', err)
    await bufferSessions(config.deviceId, sessions)
    return false
  }
}

async function flushOfflineBuffer(deviceId: string, apiUrl: string): Promise<void> {
  const buffered = await readBuffer()
  if (buffered.length === 0) return

  console.log(`[syncer] Flushing ${buffered.length} buffered logs`)

  const payload: ActivityLogPayload = {
    deviceId,
    logs: buffered.map(b => ({
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
    if (response.ok) await clearBuffer()
  } catch {
    // Leave buffer intact — try again next cycle
  }
}
