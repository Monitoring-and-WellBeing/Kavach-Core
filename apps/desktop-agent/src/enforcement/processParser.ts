// ─── Process List Parsers ─────────────────────────────────────────────────────
// Two parsers: WMIC (primary) and tasklist (fallback)
// Both normalise output into a consistent ProcessInfo shape.

export interface ProcessInfo {
  name: string
  pid: number
  description?: string
}

/**
 * Parse CSV output from:
 *   wmic process get Name,ProcessId,Description /FORMAT:CSV
 *
 * WMIC CSV format (first row = "Node,Description,Name,ProcessId"):
 *   HOSTNAME,Notepad,notepad.exe,1234
 */
export function parseWmicOutput(csv: string): ProcessInfo[] {
  const lines = csv
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('Node'))

  return lines
    .map(line => {
      const parts = line.split(',')
      // Columns after header: Node(0), Description(1), Name(2), ProcessId(3)
      return {
        description: parts[1]?.trim() || '',
        name: parts[2]?.trim() || '',
        pid: parseInt(parts[3]?.trim() || '0', 10),
      }
    })
    .filter(p => p.pid > 0 && p.name.length > 0)
}

/**
 * Parse CSV output from:
 *   tasklist /FO CSV /NH
 *
 * Format: "chrome.exe","1234","Console","1","50,000 K"
 */
export function parseTasklistOutput(csv: string): ProcessInfo[] {
  const lines = csv
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  return lines
    .map(line => {
      // Split on `","` and strip remaining quotes
      const parts = line.split('","').map(p => p.replace(/"/g, '').trim())
      return {
        name: parts[0] || '',
        pid: parseInt(parts[1] || '0', 10),
      }
    })
    .filter(p => p.pid > 0 && p.name.length > 0)
}
