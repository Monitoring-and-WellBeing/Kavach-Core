'use client'
import { useEffect, useState, useCallback } from 'react'
import { MapPin, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface LocationPayload {
  latitude: number
  longitude: number
  accuracy: number | null
  speed: number | null
  altitude: number | null
  recordedAt: string
  syncedAt: string
}

const POLL_INTERVAL_MS = 2 * 60 * 1000   // 2 minutes
const STALE_THRESHOLD_MIN = 10            // "phone may be offline" warning

export function LocationCard({ deviceId }: { deviceId: string }) {
  const [location, setLocation] = useState<LocationPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const fetchLocation = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(false)

      try {
        const res = await fetch(`/api/v1/location/current/${deviceId}`, {
          credentials: 'include',
        })
        if (res.status === 204) {
          setLocation(null)
        } else if (res.ok) {
          setLocation(await res.json())
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [deviceId]
  )

  useEffect(() => {
    fetchLocation()
    const interval = setInterval(() => fetchLocation(true), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchLocation])

  // Minutes since last GPS fix
  const minutesAgo = location
    ? Math.floor(
        (Date.now() - new Date(location.recordedAt).getTime()) / 60_000
      )
    : null

  const isStale = minutesAgo !== null && minutesAgo > STALE_THRESHOLD_MIN
  const isFresh = minutesAgo !== null && minutesAgo < 5

  const statusColor = isFresh
    ? 'text-green-600'
    : isStale
    ? 'text-amber-600'
    : 'text-gray-500'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <MapPin size={14} className="text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Location</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Freshness badge */}
          {location && minutesAgo !== null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${statusColor}`}>
              {isFresh ? <Wifi size={12} /> : <WifiOff size={12} />}
              {minutesAgo === 0 ? 'Just now' : `${minutesAgo}m ago`}
            </div>
          )}

          {/* Manual refresh */}
          <button
            onClick={() => fetchLocation(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh location"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="h-36 bg-gray-100 rounded-xl animate-pulse" />
      )}

      {/* Error */}
      {!loading && error && (
        <div className="h-36 flex items-center justify-center text-gray-400 text-xs text-center px-4">
          Could not load location.
          <br />
          <button
            onClick={() => fetchLocation()}
            className="mt-1 text-blue-500 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* No data yet */}
      {!loading && !error && !location && (
        <div className="h-36 flex flex-col items-center justify-center text-gray-400 text-xs text-center gap-1">
          <MapPin size={24} className="text-gray-200" />
          No location data yet
          <span className="text-gray-300 text-xs">
            Updates once the student's phone is active
          </span>
        </div>
      )}

      {/* Map + timestamp */}
      {!loading && !error && location && (
        <>
          {/* Embedded map */}
          <div className="rounded-xl overflow-hidden mb-2 h-36 bg-gray-100">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
              title="Student location"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {minutesAgo === 0
                ? 'Updated just now'
                : `Updated ${minutesAgo}m ago`}
            </div>

            {isStale && (
              <span className="text-xs text-amber-600 font-medium">
                ⚠ Phone may be offline
              </span>
            )}

            {/* Accuracy indicator */}
            {location.accuracy != null && (
              <span className="text-xs text-gray-300">
                ±{Math.round(location.accuracy)}m
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
