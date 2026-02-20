import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { UsageSession } from '../tracking/tracker'

const BUFFER_PATH = path.join(
  process.env.APPDATA || os.homedir(),
  'KavachAI',
  'offline-buffer.json'
)

export interface BufferedLog {
  deviceId: string
  session: UsageSession
  bufferedAt: string
}

export async function bufferSessions(deviceId: string, sessions: UsageSession[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(BUFFER_PATH), { recursive: true })
    let existing: BufferedLog[] = []
    try {
      const raw = await fs.readFile(BUFFER_PATH, 'utf-8')
      existing = JSON.parse(raw)
    } catch {}

    const newLogs: BufferedLog[] = sessions.map(s => ({
      deviceId,
      session: s,
      bufferedAt: new Date().toISOString(),
    }))

    // Keep max 5000 buffered logs (prevent unbounded growth)
    const combined = [...existing, ...newLogs].slice(-5000)
    await fs.writeFile(BUFFER_PATH, JSON.stringify(combined))
  } catch (err) {
    console.error('[buffer] Failed to write offline buffer:', err)
  }
}

export async function readBuffer(): Promise<BufferedLog[]> {
  try {
    const raw = await fs.readFile(BUFFER_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function clearBuffer(): Promise<void> {
  try {
    await fs.writeFile(BUFFER_PATH, '[]')
  } catch {}
}
