import { loadConfig } from '../auth/config'
import { AgentBlockRule } from './blockingEngine'

export async function reportViolation(
  appName: string,
  processName: string,
  windowTitle: string,
  category: string,
  rule: AgentBlockRule
): Promise<void> {
  const config = await loadConfig()
  if (!config.deviceLinked || !config.deviceId) return

  try {
    await fetch(`${config.apiUrl}/api/v1/blocking/violations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: config.deviceId,
        ruleId: rule.id,
        appName,
        processName,
        windowTitle,
        category,
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Non-critical — violation reporting failure shouldn't affect blocking
    console.warn(`[blocker] Failed to report violation for ${appName}`)
  }
}
