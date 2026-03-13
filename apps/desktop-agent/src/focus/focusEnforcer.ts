import { loadConfig } from '../auth/config'
import { killProcess, showBlockNotification } from '../blocking/processKiller'

export interface AgentFocusStatus {
  focusActive: boolean
  sessionId?: string
  title?: string
  remainingSeconds?: number
  whitelistedProcesses?: string[]
}

let currentStatus: AgentFocusStatus = { focusActive: false }
let focusOverlayWindow: Electron.BrowserWindow | null = null

// Poll backend every 15 seconds for focus status
export async function pollFocusStatus(): Promise<AgentFocusStatus> {
  const config = await loadConfig()
  if (!config.deviceLinked || !config.deviceId) return { focusActive: false }

  try {
    const res = await fetch(
      `${config.apiUrl}/api/v1/focus/agent/${config.deviceId}/status`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const prev = currentStatus
      currentStatus = await res.json() as AgentFocusStatus

      // Focus just started
      if (!prev.focusActive && currentStatus.focusActive) {
        onFocusStarted()
      }

      // Focus just ended
      if (prev.focusActive && !currentStatus.focusActive) {
        onFocusEnded()
      }

      // Update overlay if active
      if (currentStatus.focusActive && focusOverlayWindow) {
        updateFocusOverlay()
      }
    }
  } catch {
    // Keep previous status on network failure
  }

  return currentStatus
}

export function getCurrentFocusStatus(): AgentFocusStatus {
  return currentStatus
}

// Check if an app should be blocked during focus mode
export function isFocusBlocked(processName: string): boolean {
  if (!currentStatus.focusActive) return false
  if (!currentStatus.whitelistedProcesses) return true

  const proc = processName.toLowerCase()
  const isWhitelisted = currentStatus.whitelistedProcesses.some(
    w => proc === w.toLowerCase() || proc.includes(w.toLowerCase())
  )

  // Always allow system processes
  const systemProcesses = ['explorer.exe', 'taskmgr.exe', 'svchost.exe',
    'system', 'winlogon.exe', 'csrss.exe', 'lsass.exe']
  const isSystem = systemProcesses.some(s => proc === s)

  return !isWhitelisted && !isSystem
}

function onFocusStarted() {
  console.log('[focus] Focus mode STARTED:', currentStatus.title)
  showFocusOverlay()
}

function onFocusEnded() {
  console.log('[focus] Focus mode ENDED')
  hideFocusOverlay()
}

// Show a small persistent overlay showing remaining time
export function showFocusOverlay() {
  if (typeof (globalThis as any).window !== 'undefined') return // Skip in renderer process

  try {
    const { BrowserWindow } = require('electron')
    if (focusOverlayWindow) { focusOverlayWindow.close(); focusOverlayWindow = null }

    focusOverlayWindow = new BrowserWindow({
      width: 200, height: 60,
      x: 10, y: 10,
      frame: false, alwaysOnTop: true, skipTaskbar: true,
      resizable: false, focusable: false,
      transparent: true,
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    })

    updateFocusOverlay()
  } catch (e) {
    // Electron not available in dev mode
    console.log('[focus] Overlay would show:', currentStatus.remainingSeconds, 's remaining')
  }
}

function updateFocusOverlay() {
  if (!focusOverlayWindow) return

  try {
    const mins = Math.floor((currentStatus.remainingSeconds || 0) / 60)
    const secs = (currentStatus.remainingSeconds || 0) % 60
    const html = `
      <html><body style="margin:0;background:#1E293B;border-radius:8px;padding:8px 12px;font-family:system-ui;">
        <div style="color:#94A3B8;font-size:10px;margin-bottom:2px">🎯 Focus Mode</div>
        <div style="color:#F8FAFC;font-size:16px;font-weight:bold">${mins}:${secs.toString().padStart(2, '0')}</div>
      </body></html>
    `
    focusOverlayWindow.loadURL(`data:text/html,${encodeURIComponent(html)}`)
  } catch (e) {
    // Ignore update errors
  }
}

export function hideFocusOverlay() {
  if (focusOverlayWindow) {
    focusOverlayWindow.close()
    focusOverlayWindow = null
  }
}
