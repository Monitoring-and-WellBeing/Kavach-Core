import { exec } from 'child_process'
import { promisify } from 'util'
import { classifyApp, AppCategory } from './categoryClassifier'

const execAsync = promisify(exec)

export interface ActiveWindow {
  processName: string
  windowTitle: string
  appName: string
  category: AppCategory
}

export interface UsageSession {
  processName: string
  appName: string
  windowTitle: string
  category: AppCategory
  startedAt: Date
  endedAt: Date
  durationSeconds: number
}

// ── Windows: get active window via PowerShell ─────────────────────────────────
const PS_SCRIPT = `
$hwnd = [System.Runtime.InteropServices.Marshal]::GetActiveWindow()
if ($hwnd -eq 0) { $hwnd = (Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1).MainWindowHandle }
$processId = 0
$null = [System.Runtime.InteropServices.Marshal]::IsComObject($hwnd)
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class WinAPI {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder t, int c);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
  }
"@
$h = [WinAPI]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512
[WinAPI]::GetWindowText($h, $sb, 512) | Out-Null
$pid2 = 0
[WinAPI]::GetWindowThreadProcessId($h, [ref]$pid2) | Out-Null
$proc = Get-Process -Id $pid2 -ErrorAction SilentlyContinue
if ($proc) { Write-Output "$($proc.Name)|$($sb.ToString())" }
`.trim()

export async function getActiveWindow(): Promise<ActiveWindow | null> {
  try {
    if (process.platform !== 'win32') {
      // macOS/Linux fallback for development
      return {
        processName: 'code.exe',
        windowTitle: 'VS Code - Development',
        appName: 'VS Code',
        category: 'EDUCATION',
      }
    }

    const { stdout } = await execAsync(
      `powershell -NonInteractive -WindowStyle Hidden -Command "${PS_SCRIPT.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
      { timeout: 3000 }
    )

    const parts = stdout.trim().split('|')
    if (parts.length < 1 || !parts[0]) return null

    const processName = parts[0].trim() + (parts[0].trim().endsWith('.exe') ? '' : '.exe')
    const windowTitle = parts[1]?.trim() || ''
    const { category, friendlyName } = classifyApp(processName, windowTitle)

    return { processName, windowTitle, appName: friendlyName, category }
  } catch {
    return null
  }
}

// ── Session aggregator ────────────────────────────────────────────────────────
// Groups consecutive polls of the same app into one session

interface InProgressSession {
  processName: string
  appName: string
  windowTitle: string
  category: AppCategory
  startedAt: Date
  lastSeen: Date
}

let currentSession: InProgressSession | null = null
const completedSessions: UsageSession[] = []

const SESSION_GAP_SECONDS = 10 // if same app not seen for 10s, end session

export function recordWindow(window: ActiveWindow | null): UsageSession[] {
  const now = new Date()
  const flushed: UsageSession[] = []

  if (!window) {
    // Nothing active — close current session if open
    if (currentSession) {
      flushed.push(closeSession(currentSession, now))
      currentSession = null
    }
    return flushed
  }

  if (currentSession && currentSession.processName === window.processName) {
    // Same app — extend session
    currentSession.lastSeen = now
    currentSession.windowTitle = window.windowTitle // update title in case it changed
  } else {
    // Different app — close previous session, start new one
    if (currentSession) {
      const duration = (now.getTime() - currentSession.startedAt.getTime()) / 1000
      if (duration >= 3) { // ignore sessions under 3 seconds (accidental focus)
        flushed.push(closeSession(currentSession, now))
      }
    }
    currentSession = {
      processName: window.processName,
      appName: window.appName,
      windowTitle: window.windowTitle,
      category: window.category,
      startedAt: now,
      lastSeen: now,
    }
  }

  return flushed
}

function closeSession(session: InProgressSession, endTime: Date): UsageSession {
  const durationSeconds = Math.round(
    (endTime.getTime() - session.startedAt.getTime()) / 1000
  )
  return {
    processName: session.processName,
    appName: session.appName,
    windowTitle: session.windowTitle,
    category: session.category,
    startedAt: session.startedAt,
    endedAt: endTime,
    durationSeconds: Math.max(durationSeconds, 1),
  }
}

// Force-flush current session (called before sync)
export function flushCurrentSession(): UsageSession | null {
  if (!currentSession) return null
  const now = new Date()
  const duration = (now.getTime() - currentSession.startedAt.getTime()) / 1000
  if (duration < 3) return null
  const session = closeSession(currentSession, now)
  // Don't clear currentSession — it will continue after flush
  currentSession = { ...currentSession, startedAt: now }
  return session
}

// Legacy exports for backward compatibility (if needed)
export async function startTracking(): Promise<UsageSession[]> {
  const window = await getActiveWindow()
  return recordWindow(window)
}

export function stopTracking(): void {
  currentSession = null
}
