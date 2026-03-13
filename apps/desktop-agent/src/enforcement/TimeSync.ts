// ─── Server Time Sync (anti-clock-manipulation) ───────────────────────────────
// The enforcement schedule checks use server time, NOT the local system clock.
// A student changing Windows clock to skip a scheduled block window is therefore
// ineffective — the agent always computes "now" relative to the last known
// server offset.

import { loadConfig } from '../auth/config'

class TimeSyncService {
  /** ms delta: serverTime = Date.now() + serverTimeOffset */
  private serverTimeOffset = 0
  private lastSync = 0
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000  // 5 minutes

  /**
   * Fetch current server time and compute the local→server offset.
   * Fire-and-forget safe: if the request fails we keep the last offset.
   */
  async sync(): Promise<void> {
    try {
      const config = await loadConfig()
      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'

      const localBefore = Date.now()
      const res = await fetch(`${apiBase}/health/time`, {
        signal: AbortSignal.timeout(5000),
      })

      if (!res.ok) return

      const localAfter = Date.now()
      const { timestamp } = await res.json() as { timestamp: string }
      const serverTime = new Date(timestamp).getTime()

      // Correct for half the round-trip latency
      const networkLatency = (localAfter - localBefore) / 2
      this.serverTimeOffset = serverTime - (localBefore + networkLatency)
      this.lastSync = Date.now()

      console.debug(`[TimeSync] Offset: ${this.serverTimeOffset}ms (latency ${networkLatency.toFixed(0)}ms)`)
    } catch {
      // Keep previous offset — enforcement continues with last known good value
      console.debug('[TimeSync] Sync failed — using cached offset')
    }
  }

  /**
   * Returns the current time adjusted for server offset.
   * Automatically triggers a background re-sync every SYNC_INTERVAL_MS.
   */
  getNow(): Date {
    if (Date.now() - this.lastSync > this.SYNC_INTERVAL_MS) {
      this.sync()  // fire-and-forget; won't block enforcement
    }
    return new Date(Date.now() + this.serverTimeOffset)
  }
}

// Singleton exported for use across the enforcement layer
export const timeSync = new TimeSyncService()
export type { TimeSyncService }
