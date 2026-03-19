// ─── Enforcement Engine ───────────────────────────────────────────────────────
// Core loop that runs every 2 seconds and kills any blocked app it finds
// running.  Handles all edge cases:
//   • App restart after kill  → kill cooldown + repeated polling
//   • Admin process           → full-screen overlay fallback
//   • Multiple instances      → kills ALL matching PIDs with /T (child tree)
//   • Clock manipulation      → schedule checked against server time (TimeSync)
//   • Crash recovery          → agent registered as Windows startup item
//   • Reporting               → fire-and-forget, never blocks enforcement

import { exec } from 'child_process'
import { promisify } from 'util'
import { parseWmicOutput, parseTasklistOutput, ProcessInfo } from './processParser'
import { timeSync } from './TimeSync'
import { loadConfig } from '../auth/config'
import { ScreenshotCapture } from '../screenshots/ScreenshotCapture'
import { activeAppUsage } from './UsageTracker'
import { logger } from '../logger'

const execAsync = promisify(exec)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BlockingRule {
  id: string
  type: 'BLOCK_APP' | 'BLOCK_URL' | 'FOCUS_MODE' | 'TIME_LIMIT'
  /** process name / URL pattern / category — matches against running processes */
  target: string
  schedule?: {
    /** 0 = Sunday … 6 = Saturday */
    days: number[]
    startTime: string  // "HH:MM"
    endTime: string    // "HH:MM"
  }
  isActive: boolean
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

// ── Engine ────────────────────────────────────────────────────────────────────

export class EnforcementEngine {
  private rules: BlockingRule[] = []
  private timeLimits: TimeLimitStatus = { entries: [] }
  private focusModeActive = false
  private focusWhitelist: string[] = []
  private enforcementInterval: NodeJS.Timeout | null = null

  /**
   * Tracks the last time we attempted to kill a given process name.
   * Prevents spam-killing on rapid re-launches (edge case 1).
   * Also used to deduplicate warning notifications per session.
   */
  private killCooldown = new Map<string, number>()
  private readonly KILL_COOLDOWN_MS = 3000  // 3 s between kill attempts per process

  /** Screenshot capture — injected after construction so main.ts controls lifecycle */
  private screenshotCapture: ScreenshotCapture | null = null

  constructor(private readonly deviceId: string) {}

  /** Wire in a ScreenshotCapture instance (called from main.ts after loadSettings()) */
  setScreenshotCapture(sc: ScreenshotCapture): void {
    this.screenshotCapture = sc
  }

  setRules(rules: BlockingRule[]): void {
    this.rules = rules
  }

  getRules(): BlockingRule[] {
    return this.rules
  }

  setTimeLimits(status: TimeLimitStatus): void {
    this.timeLimits = status
  }

  setFocusMode(active: boolean, whitelist: string[]): void {
    this.focusModeActive = active
    this.focusWhitelist = whitelist
  }

  start(): void {
    if (this.enforcementInterval) return
    // 2-second cadence: fast enough to catch re-launches, low enough CPU impact
    this.enforcementInterval = setInterval(() => {
      this.enforce().catch(err =>
        logger.error('[Enforcement] Enforce cycle error', String(err))
      )
    }, 2000)
    logger.info('[Enforcement] Engine started')
  }

  stop(): void {
    if (this.enforcementInterval) {
      clearInterval(this.enforcementInterval)
      this.enforcementInterval = null
    }
    logger.info('[Enforcement] Engine stopped')
  }

  // ── Private: main enforcement cycle ────────────────────────────────────────

  private async enforce(): Promise<void> {
    const [processes, now] = await Promise.all([
      this.getActiveProcesses(),
      Promise.resolve(timeSync.getNow()),
    ])

    // Track foreground app time for usage reporting
    const foreground = processes[0]?.name || null
    if (foreground) activeAppUsage.update(foreground)

    // Blocking rules
    for (const rule of this.rules) {
      if (!rule.isActive) continue
      if (!this.isScheduleActive(rule, now)) continue

      if (rule.type === 'BLOCK_APP') {
        await this.enforceAppBlock(rule, processes)
      }
    }

    // Time limit enforcement (soft limits → kill at limit, warn before)
    await this.enforceTimeLimits(processes)

    // Focus mode enforcement (kill anything not on the whitelist)
    await this.enforceFocusMode(processes)
  }

  private async enforceAppBlock(
    rule: BlockingRule,
    processes: ProcessInfo[]
  ): Promise<void> {
    // Normalise: strip .exe suffix and lowercase for resilient matching
    // This also handles edge case 7 (app rename/copy) via partial match
    const target = rule.target.toLowerCase().replace(/\.exe$/i, '')

    const matching = processes.filter(p => {
      const name = p.name.toLowerCase().replace(/\.exe$/i, '')
      return name === target || name.includes(target)
    })

    for (const proc of matching) {
      await this.killProcess(proc, rule)
    }
  }

  private async killProcess(proc: ProcessInfo, rule: BlockingRule): Promise<void> {
    const lastKill = this.killCooldown.get(proc.name.toLowerCase()) || 0
    const now = Date.now()

    // Cooldown — don't spam kill same process (edge case 1)
    if (now - lastKill < this.KILL_COOLDOWN_MS) return

    this.killCooldown.set(proc.name.toLowerCase(), now)

    try {
      if (process.platform === 'win32') {
        // /F = force-kill  /PID = target by PID  /T = include child processes
        // This kills all windows of multi-instance apps (edge case 4) and
        // handles most admin processes below privileged level (edge case 3)
        await execAsync(`taskkill /F /PID ${proc.pid} /T`, { timeout: 5000 })
      }

      logger.info(`[Enforcement] Killed ${proc.name} (PID ${proc.pid}) — rule ${rule.id}`)
      this.showBlockNotification(proc.name, rule)
      this.reportEvent(proc.name, rule.id, 'BLOCKED')

      // Capture screenshot evidence of the violation (fire-and-forget)
      if (this.screenshotCapture) {
        this.screenshotCapture
          .captureOnViolation(proc.name, rule.id, this.deviceId)
          .catch(() => {})  // never let screenshot failure affect enforcement
      }

    } catch (err: any) {
      if (
        err.message?.includes('Access is denied') ||
        err.message?.includes('access denied')
      ) {
        // Edge case 3: process running as admin — agent can't kill it.
        // Fallback: cover it with a full-screen blocking overlay.
        logger.warn(`[Enforcement] Access denied for ${proc.name} — showing overlay`)
        this.showBlockOverlay(proc.name, rule)
        this.reportEvent(proc.name, rule.id, 'OVERLAY_SHOWN')

        // Capture screenshot even for overlay-blocked processes
        if (this.screenshotCapture) {
          this.screenshotCapture
            .captureOnViolation(proc.name, rule.id, this.deviceId)
            .catch(() => {})
        }
      } else if (
        err.message?.includes('not found') ||
        err.message?.includes('not running') ||
        err.message?.includes('No such process')
      ) {
        // Process exited between our list and the kill — harmless
        logger.debug(`[Enforcement] ${proc.name} already exited`)
      } else {
        logger.error(`[Enforcement] Kill failed for ${proc.name}`, err.message)
      }
    }
  }

  // ── Private: time limit enforcement ──────────────────────────────────────

  private async enforceTimeLimits(processes: ProcessInfo[]): Promise<void> {
    for (const proc of processes) {
      const limit = this.getTimeLimitForProcess(proc.name)
      if (!limit) continue

      if (limit.limitReached) {
        // Daily limit hit — treat same as a blocked app: kill + report
        await this.killProcess(proc, {
          id: limit.ruleId,
          type: 'TIME_LIMIT',
          target: proc.name,
          isActive: true,
        })
        this.showTimeLimitNotification(proc.name, limit.appCategory)
      } else if (limit.warningThreshold) {
        const remainingMins = Math.ceil(limit.remainingSeconds / 60)
        this.showTimeLimitWarning(proc.name, remainingMins)
      }
    }
  }

  private getTimeLimitForProcess(processName: string): TimeLimitEntry | null {
    const name = processName.toLowerCase()
    const category = categorizeProcess(processName)
    return this.timeLimits.entries.find(e =>
      (e.packageName && name.includes(e.packageName.toLowerCase())) ||
      category === e.appCategory
    ) || null
  }

  // ── Private: focus mode enforcement ──────────────────────────────────────

  private async enforceFocusMode(processes: ProcessInfo[]): Promise<void> {
    if (!this.focusModeActive) return

    for (const proc of processes) {
      // System processes and whitelisted apps are always allowed
      if (this.isSystemProcess(proc.name)) continue

      const isWhitelisted = this.focusWhitelist.some(w =>
        proc.name.toLowerCase().includes(w.toLowerCase())
      )
      if (isWhitelisted) continue

      // Block everything else during focus mode
      await this.killProcess(proc, {
        id: 'focus-mode',
        type: 'FOCUS_MODE',
        target: proc.name,
        isActive: true,
      })
    }
  }

  private isSystemProcess(name: string): boolean {
    const n = name.toLowerCase().replace(/\.exe$/i, '')
    return [
      'system', 'svchost', 'explorer', 'winlogon', 'lsass', 'csrss',
      'wininit', 'services', 'smss', 'kavach', 'electron',
    ].some(s => n.includes(s))
  }

  // ── Private: time limit notifications ────────────────────────────────────

  private showTimeLimitNotification(appName: string, category: string): void {
    try {
      const { Notification } = require('electron')
      new Notification({
        title: '⏱ Time Limit Reached — KAVACH',
        body: `Daily ${category} limit reached. ${appName} has been closed.`,
      }).show()
    } catch {
      // Electron API not available in unit test context — ignore
    }
  }

  private showTimeLimitWarning(appName: string, remainingMins: number): void {
    // Deduplicate: only show warning once per app + remaining-minutes bucket per session
    const key = `warning-${appName}-${remainingMins}`
    if (this.killCooldown.has(key)) return
    this.killCooldown.set(key, Date.now())

    try {
      const { Notification } = require('electron')
      new Notification({
        title: '⏱ Time Limit Warning — KAVACH',
        body: `${remainingMins} minute${remainingMins !== 1 ? 's' : ''} remaining for ${appName} today.`,
      }).show()
    } catch {
      // Electron API not available in unit test context — ignore
    }
  }

  // ── Private: schedule check ────────────────────────────────────────────────

  private isScheduleActive(rule: BlockingRule, now: Date): boolean {
    if (!rule.schedule) return true  // no schedule = always active

    const day = now.getDay()
    if (!rule.schedule.days.includes(day)) return false

    const [startH, startM] = rule.schedule.startTime.split(':').map(Number)
    const [endH, endM] = rule.schedule.endTime.split(':').map(Number)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes < endMinutes) {
      // Normal window e.g. 09:00–17:00
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } else {
      // Overnight window e.g. 22:00–06:00
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
  }

  // ── Private: process enumeration ──────────────────────────────────────────

  private async getActiveProcesses(): Promise<ProcessInfo[]> {
    if (process.platform !== 'win32') {
      // Development mode on macOS/Linux — return empty list
      return []
    }

    try {
      // Primary: WMIC gives us name + PID + description
      const { stdout } = await execAsync(
        'wmic process get Name,ProcessId,Description /FORMAT:CSV',
        { timeout: 8000 }
      )
      return parseWmicOutput(stdout)
    } catch {
      // Fallback: tasklist (always available, lighter weight)
      try {
        const { stdout } = await execAsync('tasklist /FO CSV /NH', { timeout: 8000 })
        return parseTasklistOutput(stdout)
      } catch (err) {
        logger.error('[Enforcement] Could not enumerate processes', String(err))
        return []
      }
    }
  }

  // ── Private: notifications ────────────────────────────────────────────────

  private showBlockNotification(appName: string, rule: BlockingRule): void {
    try {
      const { Notification } = require('electron')
      new Notification({
        title: '🛡️ KAVACH — App Blocked',
        body: `${appName} is blocked right now. Focus on your studies! 📚`,
        silent: false,
      }).show()
    } catch {
      // Electron API not available in unit test context — ignore
    }
  }

  /**
   * Fallback for admin-protected processes (edge case 3).
   * Creates a full-screen, always-on-top Electron window covering the blocked app.
   * Auto-closes after 5 seconds once the enforcement loop catches the process.
   */
  private showBlockOverlay(appName: string, _rule: BlockingRule): void {
    try {
      const { BrowserWindow } = require('electron')
      const overlay: Electron.BrowserWindow = new BrowserWindow({
        fullscreen: true,
        alwaysOnTop: true,
        focusable: false,
        transparent: false,
        backgroundColor: '#0F172A',
        frame: false,
        skipTaskbar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })

      const html = encodeURIComponent(`
        <html>
          <body style="margin:0;background:#0F172A;color:white;font-family:system-ui;
            display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="text-align:center">
              <div style="font-size:72px">🛡️</div>
              <h1 style="font-size:36px;color:#2563EB;margin:16px 0 8px">KAVACH</h1>
              <p style="font-size:22px;color:#94A3B8">${appName} is blocked right now.</p>
              <p style="font-size:16px;color:#64748B">Your parent/institute has restricted this app.</p>
            </div>
          </body>
        </html>
      `)
      overlay.loadURL(`data:text/html,${html}`)

      // Auto-destroy after 5 s; by then the process should be gone
      setTimeout(() => {
        try { overlay.destroy() } catch { /* already gone */ }
      }, 5000)
    } catch {
      // Electron not available (test environment) — ignore
    }
  }

  // ── Private: backend reporting ────────────────────────────────────────────

  private reportEvent(processName: string, ruleId: string, action: string): void {
    // Fire-and-forget — enforcement must never block waiting for a network call
    loadConfig().then(config => {
      if (!config.deviceLinked || !config.deviceId) return
      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'
      fetch(`${apiBase}/enforcement/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          processName,
          ruleId,
          action,
          platform: 'WINDOWS',
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {})  // never let reporting failure crash enforcement
    }).catch(() => {})
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categorizeProcess(processName: string): string {
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
