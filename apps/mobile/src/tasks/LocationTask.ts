/**
 * LocationTask — background GPS tracking.
 *
 * Updates fire every 2 minutes OR every 50 metres, whichever comes first.
 * Every location is:
 *   1. Stored in AsyncStorage as "last known" (parent can always see it)
 *   2. Sent to /api/v1/location/update if online
 *   3. Queued in OfflineQueue if offline — bulk-uploaded on reconnect
 *
 * A foreground-service notification is shown on Android so the OS doesn't
 * kill the task.
 */
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { api } from '../lib/axios'
import { OfflineQueue } from '../lib/OfflineQueue'
import { AuthStorage } from '../lib/auth'

export const LOCATION_TASK = 'KAVACH_LOCATION_TASK'
const LAST_LOCATION_KEY = 'kavach_last_location'

export interface LocationPayload {
  latitude: number
  longitude: number
  accuracy: number | null
  speed: number | null
  altitude: number | null
  timestamp: string
}

// ── Task definition ────────────────────────────────────────────────────────────
TaskManager.defineTask(
  LOCATION_TASK,
  async ({
    data,
    error,
  }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
    if (error) return
    if (!data?.locations?.length) return

    const loc = data.locations[0]

    // Require device pairing before sending
    const deviceId = await AuthStorage.getDeviceId()
    if (!deviceId) return

    const payload: LocationPayload & { deviceId: string } = {
      deviceId,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      speed: loc.coords.speed,
      altitude: loc.coords.altitude,
      timestamp: new Date(loc.timestamp).toISOString(),
    }

    // Always persist last-known locally (parent dashboard reads this)
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(payload))

    // Send or queue based on connectivity
    const net = await NetInfo.fetch()
    if (net.isConnected) {
      try {
        await api.post('/location/update', payload)
        // Reconnected — flush anything queued while offline
        await OfflineQueue.flush()
      } catch {
        await OfflineQueue.enqueue('location', payload)
      }
    } else {
      await OfflineQueue.enqueue('location', payload)
    }
  }
)

// ── Public helpers ─────────────────────────────────────────────────────────────

/**
 * Request background location permission then start the location task.
 * Returns true if tracking was started successfully.
 */
export async function startLocationTracking(): Promise<boolean> {
  // Foreground permission first (required before background)
  const { status: fg } = await Location.requestForegroundPermissionsAsync()
  if (fg !== 'granted') return false

  const { status: bg } = await Location.requestBackgroundPermissionsAsync()
  if (bg !== 'granted') return false

  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
  if (already) return true

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 2 * 60 * 1000,   // 2 minutes
    distanceInterval: 50,            // or 50 metres
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'KAVACH is active',
      notificationBody: 'Keeping you safe 🛡️',
      notificationColor: '#2563EB',
    },
    pausesUpdatesAutomatically: false,
  })

  return true
}

/** Stop location tracking (called on logout). */
export async function stopLocationTracking(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
  if (running) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK)
  }
}

/** Return the last location stored locally (never null after first fix). */
export async function getLastKnownLocation(): Promise<LocationPayload | null> {
  const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY)
  return raw ? (JSON.parse(raw) as LocationPayload) : null
}
