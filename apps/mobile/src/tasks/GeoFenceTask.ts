/**
 * GeoFenceTask — monitors defined safe/alert zones and fires events when
 * the student enters or exits a fence.
 *
 * Fences are loaded from /api/v1/location/geofences on each app open.
 * Enter/exit events are best-effort (not queued — too time-sensitive).
 *
 * Fence types:
 *   SAFE  — parent is notified when child LEAVES
 *   ALERT — parent is notified when child ENTERS
 */
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { api } from '../lib/axios'
import { AuthStorage } from '../lib/auth'

export const GEOFENCE_TASK = 'KAVACH_GEOFENCE_TASK'

export interface GeoFence {
  id: string
  name: string        // "Home", "School", "Coaching"
  latitude: number
  longitude: number
  radius: number      // metres
  type: 'SAFE' | 'ALERT'
}

// ── Task definition ────────────────────────────────────────────────────────────
TaskManager.defineTask(
  GEOFENCE_TASK,
  async ({
    data,
    error,
  }: TaskManager.TaskManagerTaskBody<{
    eventType: Location.GeofencingEventType
    region: Location.LocationRegion
  }>) => {
    if (error) return
    if (!data) return

    const { eventType, region } = data
    const entered = eventType === Location.GeofencingEventType.Enter
    const exited = eventType === Location.GeofencingEventType.Exit

    if (!entered && !exited) return

    const deviceId = await AuthStorage.getDeviceId()
    if (!deviceId) return

    // Best-effort — geo-fence events are not queued because they're
    // time-sensitive and stale events could confuse parents.
    try {
      await api.post('/location/geofence-event', {
        deviceId,
        regionId: region.identifier,
        regionName: region.identifier,
        event: entered ? 'ENTERED' : 'EXITED',
        timestamp: new Date().toISOString(),
      })
    } catch {
      // Offline — silently drop (see note above)
    }
  }
)

// ── Public helpers ─────────────────────────────────────────────────────────────

/**
 * Start geo-fence monitoring for the given list of fences.
 * Any previously registered fences are replaced atomically.
 */
export async function startGeoFenceMonitoring(fences: GeoFence[]): Promise<void> {
  if (fences.length === 0) return

  const regions: Location.LocationRegion[] = fences.map((f) => ({
    identifier: f.id,
    latitude: f.latitude,
    longitude: f.longitude,
    radius: f.radius,
    notifyOnEnter: true,
    notifyOnExit: true,
  }))

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions)
}

/**
 * Fetch active fences from the backend then start monitoring.
 * Called on every app open so the fence list is always fresh.
 */
export async function loadAndStartGeoFences(): Promise<void> {
  try {
    const deviceId = await AuthStorage.getDeviceId()
    if (!deviceId) return

    const { data } = await api.get<GeoFence[]>('/location/geofences', {
      params: { deviceId },
    })
    if (Array.isArray(data) && data.length > 0) {
      await startGeoFenceMonitoring(data)
    }
  } catch {
    // Offline — existing registered fences (if any) continue to work
  }
}

/** Stop geo-fence monitoring (called on logout). */
export async function stopGeoFenceMonitoring(): Promise<void> {
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)
  if (running) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK)
  }
}
