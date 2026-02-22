import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Track process kill attempts for persistent bypass detection
const processKillHistory = new Map<string, number>()

// Kill a process by name on Windows
export async function killProcess(processName: string, pid?: number): Promise<boolean> {
  if (process.platform !== 'win32') {
    console.log(`[blocker] Dev mode — would kill: ${processName}`)
    return true
  }

  try {
    // taskkill /F = force, /IM = image name, /PID = process ID
    const command = pid 
      ? `taskkill /F /PID ${pid} /T`
      : `taskkill /F /IM "${processName}" /T`
    
    await execAsync(command, { timeout: 5000 })
    
    // Log successful kill
    console.log('[blocker] Killed process', { processName, pid })
    
    // Track kill time for bypass detection
    const now = Date.now()
    const lastKill = processKillHistory.get(processName) || 0
    
    // If same process was killed within 3 seconds, it's a persistent bypass attempt
    if (lastKill > 0 && (now - lastKill) < 3000) {
      console.warn('[blocker] Persistent bypass attempt detected', {
        processName,
        pid,
        timeSinceLastKill: now - lastKill,
      })
      // Note: Violation reporting with bypassAttempt=true would be handled by caller
    }
    
    processKillHistory.set(processName, now)
    return true
  } catch (err: any) {
    // Process might have already closed
    if (err.message?.includes('not found') || err.message?.includes('not running')) {
      console.log('[blocker] Process not found (may have already exited)', { processName, pid })
      return true
    }
    
    // Log warning but don't rethrow — blocking should degrade gracefully
    console.warn('[blocker] Failed to kill process (may have already exited)', {
      processName,
      pid,
      error: String(err),
    })
    
    // Do NOT rethrow — blocking should degrade gracefully
    return false
  }
}

// Show Windows toast notification explaining the block
export async function showBlockNotification(appName: string, message: string): Promise<void> {
  if (process.platform !== 'win32') return

  // Use PowerShell to show a balloon/toast notification
  const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Shield
    $notify.Visible = $true
    $notify.ShowBalloonTip(4000, 'KAVACH AI — App Blocked', '${message.replace(/'/g, "''")}', [System.Windows.Forms.ToolTipIcon]::Warning)
    Start-Sleep -Milliseconds 4500
    $notify.Dispose()
  `.trim()

  try {
    exec(`powershell -NonInteractive -WindowStyle Hidden -Command "${ps.replace(/\n/g, ' ')}"`)
  } catch {
    // Non-critical — notification failure shouldn't stop blocking
  }
}
