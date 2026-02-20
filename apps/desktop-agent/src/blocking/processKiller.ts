import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Kill a process by name on Windows
export async function killProcess(processName: string): Promise<boolean> {
  if (process.platform !== 'win32') {
    console.log(`[blocker] Dev mode — would kill: ${processName}`)
    return true
  }

  try {
    // taskkill /F = force, /IM = image name
    await execAsync(`taskkill /F /IM "${processName}" /T`, { timeout: 5000 })
    return true
  } catch (err: any) {
    // Process might have already closed
    if (err.message?.includes('not found')) return true
    console.error(`[blocker] Failed to kill ${processName}:`, err.message)
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
