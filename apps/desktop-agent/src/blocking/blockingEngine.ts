import { loadConfig } from '../auth/config'

export interface AgentBlockRule {
  id: string
  ruleType: 'APP' | 'CATEGORY' | 'KEYWORD'
  target: string           // process name / category / keyword
  scheduleEnabled: boolean
  scheduleDays: string     // "MON,TUE,WED,THU,FRI"
  scheduleStart?: string   // "09:00"
  scheduleEnd?: string     // "17:00"
  blockMessage: string
}

// In-memory rule cache — refreshed every 60 seconds
let cachedRules: AgentBlockRule[] = []
let lastFetch = 0

export async function refreshBlockRules(): Promise<void> {
  const config = await loadConfig()
  if (!config.deviceLinked || !config.deviceId) return

  try {
    const res = await fetch(
      `${config.apiUrl}/api/v1/blocking/rules/${config.deviceId}/agent`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      cachedRules = await res.json()
      lastFetch = Date.now()
    }
  } catch {
    // Keep using cached rules on network failure
  }
}

// Check if a window should be blocked
export function shouldBlock(processName: string, windowTitle: string, category: string): {
  blocked: boolean
  rule?: AgentBlockRule
  reason?: string
} {
  const proc  = processName.toLowerCase()
  const title = windowTitle.toLowerCase()
  const now   = new Date()

  for (const rule of cachedRules) {
    // Check schedule
    if (rule.scheduleEnabled) {
      if (!isWithinSchedule(rule, now)) continue
    }

    const target = rule.target.toLowerCase()

    switch (rule.ruleType) {
      case 'APP':
        if (proc === target || proc.includes(target)) {
          return { blocked: true, rule, reason: `App blocked: ${processName}` }
        }
        break

      case 'CATEGORY':
        if (category.toUpperCase() === rule.target.toUpperCase()) {
          return { blocked: true, rule, reason: `Category blocked: ${category}` }
        }
        break

      case 'KEYWORD':
        if (title.includes(target)) {
          return { blocked: true, rule, reason: `Keyword match: ${rule.target}` }
        }
        break
    }
  }

  return { blocked: false }
}

function isWithinSchedule(rule: AgentBlockRule, now: Date): boolean {
  // Check day
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const todayLabel = days[now.getDay()]
  if (!rule.scheduleDays.includes(todayLabel)) return false

  // Check time window
  if (rule.scheduleStart && rule.scheduleEnd) {
    const [sh, sm] = rule.scheduleStart.split(':').map(Number)
    const [eh, em] = rule.scheduleEnd.split(':').map(Number)
    const nowMins  = now.getHours() * 60 + now.getMinutes()
    const startMins = sh * 60 + sm
    const endMins   = eh * 60 + em

    if (startMins < endMins) {
      // Same day window: 09:00 - 17:00
      return nowMins >= startMins && nowMins < endMins
    } else {
      // Overnight window: 22:00 - 06:00
      return nowMins >= startMins || nowMins < endMins
    }
  }

  return true
}

export function getCachedRules(): AgentBlockRule[] {
  return cachedRules
}
