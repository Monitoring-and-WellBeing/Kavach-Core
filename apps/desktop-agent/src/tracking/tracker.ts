import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ActiveWindowLog {
  appName: string;
  windowTitle: string;
  timestamp: string;
  durationMs: number;
}

let lastWindow: string = "";
let windowStartTime: number = Date.now();

export async function getActiveWindow(): Promise<{ app: string; title: string } | null> {
  try {
    if (process.platform === "win32") {
      const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]
  public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@
$hwnd = [Win32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder(256)
[Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null
$processId = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
Write-Output "$($process.Name)|$($sb.ToString())"
`;
      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      const [app, title] = stdout.trim().split("|");
      return { app: app || "Unknown", title: title || "" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function startTracking(): Promise<ActiveWindowLog[]> {
  const logs: ActiveWindowLog[] = [];
  const current = await getActiveWindow();

  if (current && current.app !== lastWindow) {
    if (lastWindow) {
      logs.push({
        appName: lastWindow,
        windowTitle: "",
        timestamp: new Date(windowStartTime).toISOString(),
        durationMs: Date.now() - windowStartTime,
      });
    }
    lastWindow = current.app;
    windowStartTime = Date.now();
  }

  return logs;
}

export function stopTracking(): void {
  lastWindow = "";
  windowStartTime = 0;
}
