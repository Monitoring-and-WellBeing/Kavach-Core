import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { UsageSession } from '../tracking/tracker'
import { logger } from '../logger'

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

    // Keep max 500 buffered logs (MAX_BUFFER_SIZE from syncer.ts)
    // Drop oldest entries if exceeded
    const MAX_BUFFER_SIZE = 500
    const combined = [...existing, ...newLogs]
    
    if (combined.length > MAX_BUFFER_SIZE) {
      logger.warn(`[buffer] Buffer size (${combined.length}) exceeds MAX_BUFFER_SIZE (${MAX_BUFFER_SIZE}), dropping oldest entries`)
    }
    
    const trimmed = combined.slice(-MAX_BUFFER_SIZE)
    await fs.writeFile(BUFFER_PATH, JSON.stringify(trimmed))
  } catch (err) {
    logger.error('[buffer] Failed to write offline buffer', String(err))
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
