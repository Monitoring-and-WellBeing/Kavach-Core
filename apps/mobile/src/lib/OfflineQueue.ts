/**
 * OfflineQueue — durable local storage for data that couldn't be sent to the
 * backend because the device was offline.  Automatically flushed when the
 * network comes back (called from LocationTask on reconnect).
 *
 * Cap: 500 items max to prevent AsyncStorage bloat.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from './axios'

const QUEUE_KEY = 'kavach_offline_queue'
const MAX_QUEUE_SIZE = 500

interface QueueItem {
  type: 'location' | 'mobile-usage'
  payload: unknown
  timestamp: string
}

export const OfflineQueue = {
  /** Add one item to the tail of the queue. */
  async enqueue(type: QueueItem['type'], payload: unknown): Promise<void> {
    const existing = await this.getAll()
    existing.push({ type, payload, timestamp: new Date().toISOString() })
    // Keep only the most-recent MAX_QUEUE_SIZE items
    const capped = existing.slice(-MAX_QUEUE_SIZE)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(capped))
  },

  /** Return all queued items (oldest first). */
  async getAll(): Promise<QueueItem[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueueItem[]) : []
  },

  /**
   * Attempt to send every queued item.
   * Items that fail are kept in the queue; items that succeed are removed.
   */
  async flush(): Promise<void> {
    const items = await this.getAll()
    if (items.length === 0) return

    const failed: QueueItem[] = []
    for (const item of items) {
      try {
        if (item.type === 'location') {
          await api.post('/location/batch', item.payload)
        } else if (item.type === 'mobile-usage') {
          await api.post('/activity/mobile-usage', item.payload)
        }
      } catch {
        // Network still unavailable or server error — keep for next flush
        failed.push(item)
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed))
  },

  /** Wipe the queue entirely (e.g. on logout). */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY)
  },
}
