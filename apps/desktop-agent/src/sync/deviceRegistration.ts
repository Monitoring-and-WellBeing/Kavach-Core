import { loadConfig, saveConfig } from '../auth/config'
import os from 'os'

const getApiBaseUrl = async () => {
  const config = await loadConfig()
  // apiUrl is base URL like http://localhost:8080, need to add /api/v1
  return config.apiUrl.replace(/\/api\/v1$/, '') + '/api/v1'
}

// Step 1: Generate a link code (called on first launch)
export async function generateLinkCode(): Promise<{ code: string; expiresInMinutes: number }> {
  const apiBase = await getApiBaseUrl()
  const response = await fetch(`${apiBase}/devices/generate-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to generate code: ${response.status}`)
  }

  return response.json()
}

// Step 2: Poll to check if the code has been used to link (web dashboard entered the code)
export async function pollForLink(code: string, maxAttempts = 90): Promise<string | null> {
  const apiBase = await getApiBaseUrl()

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 10000)) // poll every 10 seconds

    try {
      const response = await fetch(`${apiBase}/devices/check-linked?code=${code}`)
      if (response.ok) {
        const data = await response.json()
        if (data.linked && data.deviceId) {
          // Save deviceId to config
          const config = await loadConfig()
          await saveConfig({
            ...config,
            deviceLinked: true,
            deviceId: data.deviceId,
            tenantId: data.tenantId,
          })
          return data.deviceId
        }
      }
    } catch {
      // Network error — keep polling
    }
  }

  return null // timed out
}

// Send heartbeat every 30 seconds
export async function sendHeartbeat(): Promise<void> {
  const config = await loadConfig()
  if (!config.deviceLinked || !config.deviceId) return

  const apiBase = await getApiBaseUrl()
  try {
    await fetch(`${apiBase}/devices/${config.deviceId}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentVersion: config.agentVersion,
        osVersion: `${os.type()} ${os.release()}`,
        hostname: os.hostname(),
      }),
    })
  } catch {
    // Silently fail — will retry in 30s
  }
}
