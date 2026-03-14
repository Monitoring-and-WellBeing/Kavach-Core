/**
 * RuleSync — Unified enforcement state sync for the Android app.
 *
 * Fetches the complete enforcement state from /enforcement/state/{deviceId}
 * and caches it in AsyncStorage so the AppWatcherTask can enforce rules
 * even when the device is offline.
 *
 * Usage pattern:
 *   1. App starts → RuleSync.start(deviceId) called after login
 *   2. Version poll every 30 s — only full re-fetch when version changes
 *   3. AppWatcherTask reads state via RuleSync.isAppBlocked(), etc.
 *   4. On logout → RuleSync.stop()
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { api } from '../lib/axios'

// ── Storage keys ──────────────────────────────────────────────────────────────
const STATE_CACHE_KEY = 'kavach_enforcement_state'
const VERSION_KEY     = 'kavach_rules_version'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BlockingRule {
  id: string
  ruleType: string      // APP | CATEGORY | WEBSITE | KEYWORD
  target: string
  scheduleEnabled: boolean
  scheduleDays?: string  // "MON,TUE,WED,THU,FRI"
  scheduleStart?: string // "09:00"
  scheduleEnd?: string   // "17:00"
  blockMessage?: string
}

export interface TimeLimitEntry {
  ruleId: string
  appCategory: string
  packageName?: string
  dailyLimitSeconds: number
  usedSeconds: number
  remainingSeconds: number
  limitReached: boolean
  warningThreshold: boolean
}

export interface TimeLimitStatus {
  entries: TimeLimitEntry[]
}

export interface EnforcementState {
  blockingRules: BlockingRule[]
  timeLimitStatus: TimeLimitStatus
  focusModeActive: boolean
  focusEndsAt: string | null
  focusWhitelist: string[]
  rulesVersion: number
}

// ── RuleSyncService ───────────────────────────────────────────────────────────

class RuleSyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private deviceId: string | null = null
  private state: EnforcementState | null = null
  private listeners: ((state: EnforcementState) => void)[] = []

  // ── Lifecycle ───────────────────────────────────────────────────────────

  async start(deviceId: string): Promise<void> {
    this.deviceId = deviceId

    // Load cached state immediately — works fully offline
    await this.loadCachedState()

    // Sync if we have connectivity
    const net = await NetInfo.fetch()
    if (net.isConnected) {
      await this.fullSync()
    }

    // Poll version every 30 s — only full re-fetch when something changed
    this.syncInterval = setInterval(async () => {
      if (!this.deviceId) return
      const net = await NetInfo.fetch()
      if (!net.isConnected) return

      try {
        const { data } = await api.get<{ version: number }>(
          `/enforcement/version/${this.deviceId}`
        )
        const cachedVersion = parseInt(
          await AsyncStorage.getItem(VERSION_KEY) ?? '0', 10
        )
        if (data.version !== cachedVersion) {
          await this.fullSync()
        }
      } catch {
        // Network issue — keep using cached state
      }
    }, 30_000)
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.deviceId = null
  }

  /** Trigger an immediate full re-fetch (called on silent push notification). */
  async triggerSync(): Promise<void> {
    if (this.deviceId) await this.fullSync()
  }

  // ── State accessors (used by AppWatcherTask) ─────────────────────────────

  getState(): EnforcementState | null {
    return this.state
  }

  /**
   * Returns the matching blocking rule if this package is blocked,
   * or null if it's allowed.
   */
  isAppBlocked(packageName: string): BlockingRule | null {
    if (!this.state) return null
    return this.state.blockingRules.find(rule =>
      packageName.toLowerCase().includes(rule.target.toLowerCase())
    ) ?? null
  }

  /**
   * Returns the time-limit entry for this app (by package name or category),
   * or null if no limit applies.
   */
  getTimeLimitForApp(packageName: string): TimeLimitEntry | null {
    if (!this.state?.timeLimitStatus?.entries) return null
    const category = categorizeAndroid(packageName)
    return this.state.timeLimitStatus.entries.find(e =>
      (e.packageName && packageName.toLowerCase().includes(e.packageName.toLowerCase())) ||
      category === e.appCategory
    ) ?? null
  }

  /** Returns true if a focus session is currently active (and not yet expired). */
  isFocusModeActive(): boolean {
    if (!this.state?.focusModeActive) return false
    if (!this.state.focusEndsAt) return true
    return new Date(this.state.focusEndsAt) > new Date()
  }

  /** Returns true if this package is on the focus whitelist. */
  isWhitelistedDuringFocus(packageName: string): boolean {
    return (this.state?.focusWhitelist ?? []).some(w =>
      packageName.toLowerCase().includes(w.toLowerCase())
    )
  }

  /** Register a listener that is called on every state update. */
  onStateChange(listener: (state: EnforcementState) => void): void {
    this.listeners.push(listener)
  }

  // ── Private: sync ────────────────────────────────────────────────────────

  private async fullSync(): Promise<void> {
    if (!this.deviceId) return
    try {
      const { data } = await api.get<EnforcementState>(
        `/enforcement/state/${this.deviceId}`
      )
      this.state = data

      // Persist for offline use
      await AsyncStorage.setItem(STATE_CACHE_KEY, JSON.stringify(data))
      await AsyncStorage.setItem(VERSION_KEY, String(data.rulesVersion))

      // Notify all listeners (AppWatcherTask, etc.)
      this.listeners.forEach(l => l(data))

      console.log('[RuleSync] Synced —', data.blockingRules.length, 'rules,',
                  'version', data.rulesVersion, 'focus:', data.focusModeActive)
    } catch (err) {
      console.error('[RuleSync] Sync failed — retaining cached state:', err)
    }
  }

  private async loadCachedState(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(STATE_CACHE_KEY)
      if (cached) {
        this.state = JSON.parse(cached) as EnforcementState
        this.listeners.forEach(l => l(this.state!))
        console.log('[RuleSync] Loaded cached state')
      }
    } catch {
      // Corrupted cache — will re-fetch on next sync
    }
  }
}

/** Singleton — imported by AppWatcherTask and App.tsx */
export const RuleSync = new RuleSyncService()

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps an Android package name to the category strings used by the backend
 * time-limit rules.  Mirrors the desktop agent's categorize() function.
 */
export function categorizeAndroid(packageName: string): string {
  const pkg = packageName.toLowerCase()
  if (['com.supercell', 'com.roblox', 'com.mojang', 'com.ea.',
       'com.activision', 'com.gameloft'].some(g => pkg.startsWith(g)))
    return 'GAMING'
  if (['com.instagram', 'com.snapchat', 'com.zhiliaoapp.musically',
       'com.facebook', 'com.twitter', 'com.whatsapp'].some(s => pkg.startsWith(s)))
    return 'SOCIAL'
  if (['com.google.android.youtube', 'com.netflix',
       'in.startv.hotstar', 'com.amazon.avod'].some(e => pkg.startsWith(e)))
    return 'ENTERTAINMENT'
  return 'OTHER'
}
