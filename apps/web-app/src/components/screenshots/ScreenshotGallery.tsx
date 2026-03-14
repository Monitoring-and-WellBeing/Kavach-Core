'use client'
import { useState, useEffect, useCallback } from 'react'
import { Camera, Calendar, AlertTriangle, Clock, X, Trash2, Eye } from 'lucide-react'
import { api } from '@/lib/axios'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Screenshot {
  id: string
  triggerType: 'VIOLATION' | 'PERIODIC'
  appName?: string
  capturedAt: string
  fileSizeKb: number
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScreenshotGallery({ deviceId }: { deviceId: string }) {
  const today = new Date().toISOString().split('T')[0]
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch screenshots for selected date ────────────────────────────────────

  const fetchScreenshots = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<Screenshot[]>(
        `/screenshots/device/${deviceId}?date=${selectedDate}`
      )
      setScreenshots(data)
    } catch {
      setError('Could not load screenshots. Please try again.')
      setScreenshots([])
    } finally {
      setLoading(false)
    }
  }, [deviceId, selectedDate])

  useEffect(() => {
    fetchScreenshots()
  }, [fetchScreenshots])

  // ── Actions ────────────────────────────────────────────────────────────────

  const viewScreenshot = async (id: string) => {
    try {
      const { data } = await api.get<{ url: string }>(`/screenshots/${id}/url`)
      setViewUrl(data.url)
    } catch {
      alert('Could not load screenshot — please try again.')
    }
  }

  const deleteScreenshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this screenshot? This cannot be undone.')) return
    try {
      await api.delete(`/screenshots/${id}`)
      setScreenshots(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Delete failed — please try again.')
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const violations = screenshots.filter(s => s.triggerType === 'VIOLATION')
  const periodic   = screenshots.filter(s => s.triggerType === 'PERIODIC')

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Date picker + summary ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={e => setSelectedDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {!loading && (
          <span className="text-xs text-gray-400">
            {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
            {violations.length > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                · {violations.length} violation{violations.length !== 1 ? 's' : ''}
              </span>
            )}
          </span>
        )}
      </div>

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-sm text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Violation screenshots ─────────────────────────────────────────── */}
      {!loading && violations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Rule Violations ({violations.length})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {violations.map(s => (
              <ScreenshotTile
                key={s.id}
                screenshot={s}
                variant="violation"
                onView={() => viewScreenshot(s.id)}
                onDelete={e => deleteScreenshot(s.id, e)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Periodic screenshots ──────────────────────────────────────────── */}
      {!loading && periodic.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Periodic Snapshots ({periodic.length})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {periodic.map(s => (
              <ScreenshotTile
                key={s.id}
                screenshot={s}
                variant="periodic"
                onView={() => viewScreenshot(s.id)}
                onDelete={e => deleteScreenshot(s.id, e)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && !error && screenshots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
          <Camera size={32} className="opacity-30" />
          <p className="text-sm">No screenshots for this date</p>
          <p className="text-xs text-gray-300">Screenshots are captured when rules are violated or periodically during school hours</p>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {viewUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewUrl(null)}
        >
          <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
            <img
              src={viewUrl}
              alt="Screenshot"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setViewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={16} className="text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Screenshot tile ───────────────────────────────────────────────────────────

interface TileProps {
  screenshot: Screenshot
  variant: 'violation' | 'periodic'
  onView: () => void
  onDelete: (e: React.MouseEvent) => void
}

function ScreenshotTile({ screenshot, variant, onView, onDelete }: TileProps) {
  const time = new Date(screenshot.capturedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden border-2 group cursor-pointer
        transition-all hover:shadow-md hover:-translate-y-0.5
        ${variant === 'violation' ? 'border-red-200 hover:border-red-400' : 'border-gray-100 hover:border-blue-200'}
      `}
      onClick={onView}
      title={screenshot.appName ? `${screenshot.appName} · ${time}` : time}
    >
      {/* Thumbnail placeholder (real image loads via pre-signed URL on click) */}
      <div
        className={`h-20 flex flex-col items-center justify-center gap-1
          ${variant === 'violation' ? 'bg-red-50' : 'bg-gray-50'}`}
      >
        {variant === 'violation' ? (
          <AlertTriangle size={18} className="text-red-300" />
        ) : (
          <Camera size={18} className="text-gray-300" />
        )}
        <Eye size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info strip */}
      <div className="p-1.5 bg-white">
        <p className="text-xs text-gray-500 truncate leading-snug">
          {time}
          {screenshot.appName && (
            <span className="text-gray-400"> · {screenshot.appName}</span>
          )}
        </p>
        {screenshot.fileSizeKb != null && (
          <p className="text-xs text-gray-300">{screenshot.fileSizeKb} KB</p>
        )}
      </div>

      {/* Delete button — visible on hover */}
      <button
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600
          text-white rounded-full flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity shadow"
        onClick={onDelete}
        title="Delete screenshot"
        aria-label="Delete screenshot"
      >
        <Trash2 size={11} />
      </button>

      {/* Violation badge */}
      {variant === 'violation' && (
        <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs
          px-1.5 py-0.5 rounded font-medium leading-none">
          ⚠
        </div>
      )}
    </div>
  )
}
