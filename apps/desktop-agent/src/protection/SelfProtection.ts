// ─── Agent Self-Protection ────────────────────────────────────────────────────
// Edge case 5: student opens Task Manager / Process Explorer to kill the agent.
//
// Design decision (deliberate restraint):
//   We do NOT kill Task Manager — that would be overly aggressive and would
//   infuriate legitimate Windows admin users.  Instead we:
//     1. Detect known "kill-tool" processes in the running process list.
//     2. Fire an alert to the parent's dashboard immediately.
//     3. Log the event for the parent to review.
//
// Crash / restart coverage (edge case 9):
//   registerStartup() adds the agent to the Windows Run registry key so it
//   relaunches automatically after a crash or reboot.

import { exec } from 'child_process'
import { promisify } from 'util'
import { loadConfig } from '../auth/config'
import { logger } from '../logger'

const execAsync = promisify(exec)

/** Processes that are commonly used to inspect / kill other processes */
const KILL_TOOLS = [
  'taskmgr',        // Windows Task Manager
  'procexp',        // Sysinternals Process Explorer (32-bit)
  'procexp64',      // Sysinternals Process Explorer (64-bit)
  'processhacker',  // Process Hacker
  'processhacker2', // Process Hacker 2
  'autoruns',       // Sysinternals AutoRuns (can disable startup entries)
  'autorunsc',      // AutoRuns command-line
  'regedit',        // Registry Editor (could remove startup key)
]

export class SelfProtection {
  private watchdogInterval: NodeJS.Timeout | null = null

  /**
   * Tracks which kill-tools are currently open (and therefore already reported).
   * A tool is removed from this set once it disappears from the process list,
   * so the next time it's opened a fresh alert is sent.
   */
  private activeKillTools = new Set<string>()

  /**
   * Start the watchdog loop.  Checks every 3 seconds for known kill-tools.
   * @param agentPid — the main process PID (reserved for future per-PID checks)
   */
  start(_agentPid: number): void {
    if (this.watchdogInterval) return
    this.watchdogInterval = setInterval(() => {
      this.detectKillTools().catch(err =>
        logger.debug('[SelfProtection] Detection error', String(err))
      )
    }, 3000)
    logger.info('[SelfProtection] Watchdog started')
  }

  stop(): void {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval)
      this.watchdogInterval = null
    }
  }

  private async detectKillTools(): Promise<void> {
    if (process.platform !== 'win32') return

    let processList: string
    try {
      const { stdout } = await execAsync('tasklist /FO CSV /NH', { timeout: 5000 })
      processList = stdout.toLowerCase()
    } catch {
      return
    }

    const nowRunning = new Set<string>()

    for (const tool of KILL_TOOLS) {
      if (processList.includes(tool.toLowerCase())) {
        nowRunning.add(tool)
        if (!this.activeKillTools.has(tool)) {
          // New detection — report once per open-event, not every 3 s
          logger.warn(`[SelfProtection] Kill-tool opened: ${tool}`)
          this.activeKillTools.add(tool)
        await this.reportKillToolDetected(tool)
        }
      }
    }

    // Remove tools that are no longer running so they trigger a report next time
    for (const tool of this.activeKillTools) {
      if (!nowRunning.has(tool)) {
        this.activeKillTools.delete(tool)
      }
    }
  }

  private async reportKillToolDetected(toolName: string): Promise<void> {
    try {
      const config = await loadConfig()
      if (!config.deviceLinked || !config.deviceId) return
      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'

      // Report as an enforcement event so parents see it in the dashboard
      await fetch(`${apiBase}/enforcement/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: config.deviceId,
          processName: toolName,
          ruleId: null,
          action: 'KILL_TOOL_DETECTED',
          detail: `${toolName} was opened — possible bypass attempt`,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      })
    } catch {
      // Non-critical: log locally if backend is unreachable
      logger.warn(`[SelfProtection] Could not report kill-tool event for ${toolName}`)
    }
  }

  /**
   * Registers the agent executable in the Windows CurrentUser Run key so it
   * relaunches automatically after a crash or reboot (edge case 9).
   *
   * Uses HKCU (current user) — no admin rights needed.
   */
  static async registerStartup(): Promise<void> {
    if (process.platform !== 'win32') return

    const exePath = process.execPath
    // Escape backslashes for the reg command
    const safeExePath = exePath.replace(/\\/g, '\\\\')
    const regCmd =
      `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" ` +
      `/v "KavachAgent" /t REG_SZ /d "${safeExePath}" /f`

    return new Promise(resolve => {
      exec(regCmd, err => {
        if (err) {
          logger.error('[SelfProtection] Startup registration failed', err.message)
        } else {
          logger.info('[SelfProtection] Registered for Windows startup (HKCU Run key)')
        }
        resolve()
      })
    })
  }
}
