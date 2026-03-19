// ─── Browser URL Monitor ──────────────────────────────────────────────────────
// Edge case 2: Chrome/Edge is allowed but certain sites are blocked.
//
// Strategy:
//   1. Read all Chrome/Edge main-window titles via PowerShell every 2 s.
//   2. Chrome puts the page title (which often contains the domain) in the title bar.
//   3. Match against blocked URL patterns.
//   4. On match: send Ctrl+W to close the active tab AND report the event.
//
// Limitations:
//   • Title-based matching is heuristic — a page with a custom title may evade.
//   • The proper long-term solution is a browser extension (BLOCK_URL type rules).
//   • This covers the common case (YouTube, Instagram show domain in title) today.

import { exec } from 'child_process'
import { promisify } from 'util'
import { loadConfig } from '../auth/config'
import { logger } from '../logger'

const execAsync = promisify(exec)

export interface UrlBlockRule {
  id: string
  pattern: string   // e.g. "youtube.com", "instagram"
  action: 'BLOCK' | 'ALLOW'
}

export class BrowserMonitor {
  private checkInterval: NodeJS.Timeout | null = null
  private urlRules: UrlBlockRule[] = []

  /** Browsers whose window titles we monitor */
  private readonly MONITORED_BROWSERS = ['chrome', 'msedge', 'firefox', 'brave']

  setRules(rules: UrlBlockRule[]): void {
    this.urlRules = rules
  }

  start(): void {
    if (this.checkInterval) return
    this.checkInterval = setInterval(() => {
      this.checkActiveBrowserUrl().catch(err =>
        logger.debug('[BrowserMonitor] Check error', String(err))
      )
    }, 2000)
    logger.info('[BrowserMonitor] Started')
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async checkActiveBrowserUrl(): Promise<void> {
    if (process.platform !== 'win32') return
    if (this.urlRules.length === 0) return

    const titles = await this.getBrowserWindowTitles()

    for (const title of titles) {
      const blockedRule = this.urlRules.find(rule => {
        if (rule.action !== 'BLOCK') return false
        const pattern = rule.pattern.replace(/^\*\./, '').toLowerCase()
        return title.toLowerCase().includes(pattern)
      })

      if (blockedRule) {
        logger.info(`[BrowserMonitor] Blocked URL pattern "${blockedRule.pattern}" in title: ${title}`)
        await this.closeBlockedTab()
        this.reportUrlBlock(blockedRule.pattern, title)
      }
    }
  }

  /**
   * Returns all main-window titles for monitored browser processes.
   * Chrome shows "Page Title - Google Chrome"; the domain often appears in
   * the title for well-known sites (YouTube, Instagram, etc.).
   */
  private async getBrowserWindowTitles(): Promise<string[]> {
    try {
      const browserList = this.MONITORED_BROWSERS.join("','")
      const { stdout } = await execAsync(
        `powershell -NonInteractive -WindowStyle Hidden -Command "` +
        `Get-Process -Name '${browserList}' -ErrorAction SilentlyContinue ` +
        `| Where-Object { $_.MainWindowTitle -ne '' } ` +
        `| Select-Object -ExpandProperty MainWindowTitle"`,
        { timeout: 4000 }
      )
      return stdout
        .trim()
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0)
    } catch {
      return []
    }
  }

  /**
   * Sends Ctrl+W to the foreground window to close the active browser tab.
   * This is the most reliable approach without a browser extension.
   */
  private async closeBlockedTab(): Promise<void> {
    try {
      await execAsync(
        `powershell -NonInteractive -WindowStyle Hidden -Command ` +
        `"Add-Type -AssemblyName System.Windows.Forms; ` +
        `[System.Windows.Forms.SendKeys]::SendWait('^w')"`,
        { timeout: 3000 }
      )
    } catch {
      // Non-critical — the enforcement loop will handle further enforcement
    }
  }

  private reportUrlBlock(pattern: string, windowTitle: string): void {
    loadConfig().then(config => {
      if (!config.deviceLinked || !config.deviceId) return
      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'
      fetch(`${apiBase}/enforcement/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: config.deviceId,
          processName: 'browser',
          ruleId: null,
          action: 'URL_BLOCKED',
          detail: `Pattern "${pattern}" matched in title: ${windowTitle}`,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {})
    }).catch(() => {})
  }
}
