// ─── Unified Rule Sync ────────────────────────────────────────────────────────
// Fetches the full enforcement state from /enforcement/state/{deviceId} and
// pushes it into the EnforcementEngine.
//
// Resilience guarantees:
//   • SSE /api/v1/sse/device/{id} — instant push when rules change (primary)
//   • Version poll every 30 s    — fallback when SSE connection is down
//   • On network failure         → keeps current rules (enforcement never stops)
//   • Immediate sync             → rules loaded on first call before first enforce cycle
//   • Usage reporting            → accumulated per-process time reported every 5 min

import { EnforcementEngine, BlockingRule, TimeLimitStatus, TimeLimitEntry } from './EnforcementEngine'
import { BrowserMonitor } from './BrowserMonitor'
import { loadConfig } from '../auth/config'
import { activeAppUsage } from './UsageTracker'
import { logger } from '../logger'

// EventSource is available in the Electron main process via Node 18+.
// If not globally available, polyfill with node-fetch-based SSE.
// For safety we check before using:
declare const EventSource: {
  new(url: string): {
    onmessage: ((e: MessageEvent) => void) | null
    onerror: ((e: Event) => void) | null
    close(): void
    addEventListener(type: string, listener: (e: MessageEvent) => void): void
  }
} | undefined

// ── Types ─────────────────────────────────────────────────────────────────────

export type { TimeLimitEntry, TimeLimitStatus }

export interface EnforcementState {
  blockingRules: BlockingRule[]
  timeLimitStatus: TimeLimitStatus
  focusModeActive: boolean
  focusEndsAt: string | null
  focusWhitelist: string[]
  rulesVersion: number
}

// ── RuleSync ──────────────────────────────────────────────────────────────────

export class RuleSync {
  private syncInterval: NodeJS.Timeout | null = null
  private usageReportInterval: NodeJS.Timeout | null = null
  private sseReconnectTimer: NodeJS.Timeout | null = null
  private sseEmitter: ReturnType<NonNullable<typeof EventSource>['prototype']['constructor']> | null = null
  private sseConnected = false
  private lastVersion = -1
  private currentState: EnforcementState | null = null

  constructor(
    private readonly deviceId: string,
    private readonly engine: EnforcementEngine,
    private readonly browserMonitor: BrowserMonitor
  ) {}

  /** Start: connect SSE, sync immediately, then poll every 30 s as fallback */
  start(): void {
    this.fullSync()
    this.connectSse()
    this.syncInterval = setInterval(() => {
      // If SSE is up we still do a version-check poll as belt-and-suspenders
      this.syncIfChanged()
    }, 30_000)
    this.usageReportInterval = setInterval(() => this.reportUsage(), 5 * 60_000)
  }

  stop(): void {
    this.sseEmitter?.close()
    this.sseEmitter = null
    if (this.sseReconnectTimer) { clearTimeout(this.sseReconnectTimer); this.sseReconnectTimer = null }
    if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval = null }
    if (this.usageReportInterval) { clearInterval(this.usageReportInterval); this.usageReportInterval = null }
  }

  // ── SSE connection ─────────────────────────────────────────────────────────

  private async connectSse(): Promise<void> {
    // EventSource is available in Electron renderer or via Node 18+ global
    if (typeof EventSource === 'undefined') {
      logger.warn('[RuleSync] EventSource not available — SSE disabled, polling only')
      return
    }
    try {
      const config = await loadConfig()
      if (!config.deviceLinked || !config.deviceId) return

      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'
      const url = `${apiBase}/sse/device/${this.deviceId}`

      const es = new EventSource(url)
      this.sseEmitter = es
      this.sseConnected = false

      es.addEventListener('rules_updated', () => {
        logger.info('[RuleSync] SSE rules_updated — triggering immediate full sync')
        this.fullSync()
      })

      es.addEventListener('focus_start', (e: MessageEvent) => {
        logger.info('[RuleSync] SSE focus_start', e.data)
        // Trigger a full sync so focus whitelist is refreshed immediately
        this.fullSync()
      })

      es.addEventListener('focus_end', (e: MessageEvent) => {
        logger.info('[RuleSync] SSE focus_end', e.data)
        this.fullSync()
      })

      es.onerror = () => {
        es.close()
        this.sseEmitter = null
        this.sseConnected = false
        // Reconnect after 10 s
        this.sseReconnectTimer = setTimeout(() => this.connectSse(), 10_000)
      }

      this.sseConnected = true
      logger.info('[RuleSync] SSE connected to', url)
    } catch (err) {
      logger.warn('[RuleSync] SSE connect failed', String(err))
      this.sseReconnectTimer = setTimeout(() => this.connectSse(), 10_000)
    }
  }

  // ── Public helpers for EnforcementEngine ─────────────────────────────────

  getTimeLimitForApp(processName: string): TimeLimitEntry | null {
    if (!this.currentState) return null
    const name = processName.toLowerCase()
    return this.currentState.timeLimitStatus.entries.find(e =>
      (e.packageName && name.includes(e.packageName.toLowerCase())) ||
      categorize(processName) === e.appCategory
    ) || null
  }

  // ── Private: version-aware sync ──────────────────────────────────────────

  private async syncIfChanged(): Promise<void> {
    try {
      const config = await loadConfig()
      if (!config.deviceLinked || !config.deviceId) return

      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'
      const res = await fetch(
        `${apiBase}/enforcement/version/${this.deviceId}`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) return

      const { version } = await res.json() as { version: number }
      if (version !== this.lastVersion) {
        await this.fullSync()
      }
    } catch {
      // Network issue — keep enforcing cached rules
    }
  }

  private async fullSync(): Promise<void> {
    try {
      const config = await loadConfig()
      if (!config.deviceLinked || !config.deviceId) return

      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'
      const res = await fetch(
        `${apiBase}/enforcement/state/${this.deviceId}`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) {
        logger.warn(`[RuleSync] Bad response: ${res.status}`)
        return
      }

      const data = await res.json() as EnforcementState
      this.currentState = data
      this.lastVersion = data.rulesVersion

      // Map backend rule format to EnforcementEngine's BlockingRule format
      const rules: BlockingRule[] = (data.blockingRules || []).map(r => ({
        id: String((r as any).id),
        type: mapRuleType((r as any).ruleType),
        target: (r as any).target,
        schedule: (r as any).scheduleEnabled && (r as any).scheduleDays
          ? {
              days: parseDays((r as any).scheduleDays),
              startTime: (r as any).scheduleStart ?? '00:00',
              endTime: (r as any).scheduleEnd ?? '23:59',
            }
          : undefined,
        isActive: (r as any).active !== false,
      }))

      // Push state into enforcement engine
      this.engine.setRules(rules)
      this.engine.setTimeLimits(data.timeLimitStatus)
      this.engine.setFocusMode(
        data.focusModeActive,
        data.focusWhitelist || []
      )

      // Update browser monitor with URL block rules
      const urlRules = rules
        .filter(r => r.type === 'BLOCK_URL')
        .map(r => ({ id: r.id, pattern: r.target, action: 'BLOCK' as const }))
      this.browserMonitor.setRules(urlRules)

      logger.info(
        `[RuleSync] Synced — version ${data.rulesVersion}, ` +
        `${rules.length} rules, focus: ${data.focusModeActive}`
      )
    } catch (err) {
      logger.error('[RuleSync] Full sync failed — retaining cached rules', String(err))
    }
  }

  // ── Private: report accumulated usage every 5 min ────────────────────────

  private async reportUsage(): Promise<void> {
    const usage = activeAppUsage.getAndReset()
    const entries = Object.entries(usage)
    if (entries.length === 0) return

    try {
      const config = await loadConfig()
      if (!config.deviceLinked || !config.deviceId) return

      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'

      for (const [packageName, seconds] of entries) {
        if ((seconds as number) < 10) continue  // < 10 s is noise

        fetch(`${apiBase}/enforcement/usage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: this.deviceId,
            packageName,
            appCategory: categorize(packageName),
            durationSeconds: seconds,
            platform: 'WINDOWS',
          }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => {})  // fire and forget
      }
    } catch {
      // Non-fatal — usage will accumulate and be reported next cycle
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapRuleType(ruleType: string): BlockingRule['type'] {
  switch (ruleType?.toUpperCase()) {
    case 'APP':
    case 'APP_TIME_LIMIT':
    case 'KEYWORD':
      return 'BLOCK_APP'
    case 'WEBSITE':
    case 'CATEGORY':
      return 'BLOCK_URL'
    case 'FOCUS_MODE':
      return 'FOCUS_MODE'
    case 'TIME_LIMIT':
      return 'TIME_LIMIT'
    default:
      return 'BLOCK_APP'
  }
}

function parseDays(daysStr: string): number[] {
  const DAY_MAP: Record<string, number> = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
  }
  return daysStr
    .split(',')
    .map(d => DAY_MAP[d.trim().toUpperCase()])
    .filter(n => n !== undefined) as number[]
}

/**
 * Categorises a Windows process name into the same category strings
 * used by the backend time-limit rules.
 */
function categorize(processName: string): string {
  const name = processName.toLowerCase()
  if (['steam', 'epicgames', 'valorant', 'minecraft',
       'roblox', 'fortnite', 'leagueoflegends'].some(g => name.includes(g)))
    return 'GAMING'
  if (['instagram', 'snapchat', 'tiktok', 'whatsapp',
       'facebook', 'twitter'].some(s => name.includes(s)))
    return 'SOCIAL'
  if (['youtube', 'netflix', 'hotstar', 'prime'].some(e => name.includes(e)))
    return 'ENTERTAINMENT'
  if (['chrome', 'firefox', 'edge', 'brave'].some(b => name.includes(b)))
    return 'BROWSER'
  return 'OTHER'
}
