// ─── Screenshot Capture ───────────────────────────────────────────────────────
// Two capture modes:
//   1. ON VIOLATION — called by EnforcementEngine immediately after blocking an app
//   2. PERIODIC     — timer fires every N minutes during school hours (configurable)
//
// Screenshots are uploaded to the backend → stored in Cloudflare R2.
// If upload fails, we log and move on — screenshots are non-critical.

import { loadConfig } from '../auth/config'
import { logger } from '../logger'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScreenshotSettings {
  enabled: boolean
  periodicEnabled: boolean
  periodicIntervalMin: number
  violationEnabled: boolean
  schoolHoursOnly: boolean
  schoolStart: string   // "HH:MM"
  schoolEnd: string     // "HH:MM"
  retentionDays: number
  studentNotified: boolean
}

// ── Class ─────────────────────────────────────────────────────────────────────

export class ScreenshotCapture {
  private periodicTimer: NodeJS.Timeout | null = null
  private settings: ScreenshotSettings | null = null

  // ── Settings ───────────────────────────────────────────────────────────────

  /**
   * Fetch screenshot settings from the backend for this device.
   * Called once on agent startup.
   */
  async loadSettings(deviceId: string): Promise<void> {
    try {
      const config = await loadConfig()
      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'

      const res = await fetch(`${apiBase}/screenshots/settings/${deviceId}`, {
        signal: AbortSignal.timeout(5000),
      })

      if (res.ok) {
        this.settings = await res.json() as ScreenshotSettings
        logger.info('[Screenshots] Settings loaded', this.settings)
      } else {
        logger.warn('[Screenshots] Could not fetch settings, disabling capture')
        this.settings = null
      }
    } catch {
      logger.warn('[Screenshots] Settings fetch failed, disabling capture')
      this.settings = null
    }
  }

  getSettings(): ScreenshotSettings | null {
    return this.settings
  }

  // ── Violation capture ──────────────────────────────────────────────────────

  /**
   * Capture a screenshot immediately when a rule violation is detected.
   * Called by EnforcementEngine after killing/overlaying a process.
   */
  async captureOnViolation(appName: string, ruleId: string, deviceId: string): Promise<void> {
    if (!this.settings?.enabled) return
    if (!this.settings?.violationEnabled) return

    const imageBuffer = await this.capture()
    if (!imageBuffer) return

    await this.upload(imageBuffer, deviceId, 'VIOLATION', ruleId, appName)
  }

  // ── Periodic capture ───────────────────────────────────────────────────────

  /**
   * Start the periodic capture timer.
   * Only runs during school hours (if schoolHoursOnly is true).
   * Safe to call multiple times — guards against double-start.
   */
  startPeriodic(deviceId: string): void {
    if (this.periodicTimer) return
    if (!this.settings?.enabled || !this.settings?.periodicEnabled) return

    const intervalMs = (this.settings.periodicIntervalMin || 5) * 60 * 1000

    const checkAndCapture = async () => {
      if (!this.settings?.enabled || !this.settings?.periodicEnabled) return
      if (!this.isWithinSchoolHours()) return

      const imageBuffer = await this.capture()
      if (imageBuffer) {
        await this.upload(imageBuffer, deviceId, 'PERIODIC')
      }
    }

    this.periodicTimer = setInterval(checkAndCapture, intervalMs)
    logger.info(`[Screenshots] Periodic capture started — every ${intervalMs / 60000} min`)
  }

  stopPeriodic(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer)
      this.periodicTimer = null
      logger.info('[Screenshots] Periodic capture stopped')
    }
  }

  // ── Student disclosure ─────────────────────────────────────────────────────

  /**
   * Show the mandatory disclosure dialog to the student if screenshots are
   * enabled but the student hasn't been notified yet.
   * Marks studentNotified=true on backend after they click OK.
   */
  async showDisclosureIfNeeded(deviceId: string): Promise<void> {
    if (!this.settings?.enabled) return
    if (this.settings?.studentNotified) return

    try {
      const { dialog } = require('electron')
      dialog.showMessageBoxSync({
        type: 'info',
        title: 'KAVACH — Monitoring Notice',
        message: 'Screenshot monitoring is enabled on this device',
        detail:
          'Your parent has enabled screenshot monitoring on this device during school hours. ' +
          'Screenshots are stored securely for 7 days and are only visible to your parent.\n\n' +
          'This monitoring is designed to support your focus and learning.',
        buttons: ['I Understand'],
      })

      // Mark notified on backend
      const config = await loadConfig()
      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'
      await fetch(`${apiBase}/screenshots/settings/${deviceId}/mark-notified`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
      }).catch(() => {})  // non-critical

      // Update local state so we don't show again this session
      if (this.settings) {
        this.settings.studentNotified = true
      }
      logger.info('[Screenshots] Student disclosure acknowledged')
    } catch (err) {
      // Electron not available (test env) or dialog failed — ignore
      logger.warn('[Screenshots] Could not show disclosure dialog', String(err))
    }
  }

  // ── Private: capture ───────────────────────────────────────────────────────

  private async capture(): Promise<Buffer | null> {
    try {
      const { desktopCapturer, screen } = require('electron')
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width, height } = primaryDisplay.size

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          // Capture at 50% resolution — sufficient for monitoring, smaller file size
          width: Math.floor(width * 0.5),
          height: Math.floor(height * 0.5),
        },
      })

      const primarySource = sources[0]
      if (!primarySource) return null

      // Convert NativeImage to JPEG buffer at 70% quality (~50–150 KB typical)
      const jpegBuffer = primarySource.thumbnail.toJPEG(70)
      return jpegBuffer

    } catch (err) {
      logger.error('[Screenshots] Capture failed', String(err))
      return null
    }
  }

  // ── Private: upload ────────────────────────────────────────────────────────

  private async upload(
    buffer: Buffer,
    deviceId: string,
    trigger: 'VIOLATION' | 'PERIODIC',
    ruleId?: string,
    appName?: string
  ): Promise<void> {
    try {
      const config = await loadConfig()
      const apiBase = config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'

      const params = new URLSearchParams({ deviceId, trigger })
      if (ruleId) params.set('ruleId', ruleId)
      if (appName) params.set('appName', appName)

      const res = await fetch(`${apiBase}/screenshots/upload?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: buffer,
        signal: AbortSignal.timeout(10000),
      })

      if (res.ok) {
        logger.info(`[Screenshots] Uploaded (${trigger}) — ${buffer.length} bytes`)
      } else {
        logger.warn(`[Screenshots] Upload returned ${res.status}`)
      }
    } catch (err) {
      // Non-critical — log and continue; never let upload failure crash enforcement
      logger.error('[Screenshots] Upload failed', String(err))
    }
  }

  // ── Private: school hours check ────────────────────────────────────────────

  private isWithinSchoolHours(): boolean {
    if (!this.settings?.schoolHoursOnly) return true

    const now = new Date()
    const [startH, startM] = (this.settings.schoolStart || '08:00').split(':').map(Number)
    const [endH, endM]     = (this.settings.schoolEnd   || '16:00').split(':').map(Number)
    const current = now.getHours() * 60 + now.getMinutes()
    const start   = startH * 60 + startM
    const end     = endH   * 60 + endM

    return current >= start && current <= end
  }
}
