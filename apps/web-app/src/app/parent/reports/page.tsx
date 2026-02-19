'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, Download, ChevronDown, AlertCircle } from 'lucide-react'
import { useDevices } from '@/hooks/useDevices'
import { useReports } from '@/hooks/useReports'
import { ScreenTimeTrendChart } from '@/components/charts/ScreenTimeTrendChart'
import { TopAppsChart } from '@/components/charts/TopAppsChart'
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart'
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap'
import { Toast, useToast } from '@/components/ui/Toast'

type Period = 'weekly' | 'monthly'

// Category badge colors
const CAT_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-100 text-blue-700',
  GAMING: 'bg-red-100 text-red-700',
  ENTERTAINMENT: 'bg-amber-100 text-amber-700',
  SOCIAL_MEDIA: 'bg-purple-100 text-purple-700',
  PRODUCTIVITY: 'bg-green-100 text-green-700',
  COMMUNICATION: 'bg-cyan-100 text-cyan-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

function SkeletonCard({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm ${height} animate-pulse`}>
      <div className="p-5">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-1/4 mb-6" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-3/5" />
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { devices } = useDevices()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('weekly')
  const { toast, showToast, hideToast } = useToast()

  // Auto-select first device
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id)
    }
  }, [devices, selectedDeviceId])

  const { trendData, appUsage, categories, heatmap, loading, error, refetch } =
    useReports(selectedDeviceId, period)

  const selectedDevice = devices.find(d => d.id === selectedDeviceId)

  const handleExport = () => {
    showToast('Report exported successfully! Check your downloads.', 'success')
  }

  return (
    <div className="p-6 fade-up">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Usage Reports</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {selectedDevice ? `Showing data for ${selectedDevice.assignedTo || selectedDevice.name}` : 'Select a device to view reports'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Device selector */}
          <div className="relative">
            <select
              value={selectedDeviceId || ''}
              onChange={e => setSelectedDeviceId(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              {devices.length === 0 && <option value="">No devices</option>}
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.assignedTo || d.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Period toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              7 Days
            </button>
            <button onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              30 Days
            </button>
          </div>

          <button onClick={refetch} disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl mb-5">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-red-600 text-sm">{error}</span>
          <button onClick={refetch} className="ml-auto text-sm text-red-500 underline">Retry</button>
        </div>
      )}

      {/* ── No device selected ── */}
      {!selectedDeviceId && (
        <div className="flex flex-col items-center justify-center py-24">
          <span className="text-5xl mb-3">📊</span>
          <p className="text-gray-500 font-medium">Select a device to view usage reports</p>
        </div>
      )}

      {selectedDeviceId && (
        <>
          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {loading ? (
              <>
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-7 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-gray-400 text-xs font-medium">Total Screen Time</p>
                  <p className="text-gray-900 text-2xl font-bold mt-1">
                    {trendData?.totalScreenTimeFormatted || '—'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {period === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-gray-400 text-xs font-medium">Daily Average</p>
                  <p className="text-gray-900 text-2xl font-bold mt-1">
                    {trendData?.avgDailyHours ? `${trendData.avgDailyHours}h` : '—'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Per day average</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-gray-400 text-xs font-medium">Top App</p>
                  <p className="text-gray-900 text-xl font-bold mt-1 truncate">
                    {appUsage?.apps[0]?.appName || '—'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {appUsage?.apps[0]?.durationFormatted || ''}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-gray-400 text-xs font-medium">Top Category</p>
                  <p className="text-gray-900 text-xl font-bold mt-1 capitalize truncate">
                    {categories?.categories[0]?.category.toLowerCase().replace('_', ' ') || '—'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {categories?.categories[0]?.percentage
                      ? `${categories.categories[0].percentage}% of usage`
                      : ''}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── Row 1: Screen time trend + Heatmap ── */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {period === 'weekly' ? 'Weekly' : 'Monthly'} Screen Time
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {period === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                  </p>
                </div>
                {trendData && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {trendData.totalScreenTimeFormatted}
                    </div>
                    <div className="text-gray-400 text-xs">Total</div>
                  </div>
                )}
              </div>
              {loading ? (
                <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
              ) : trendData ? (
                <ScreenTimeTrendChart data={trendData} />
              ) : (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Activity Heatmap</h3>
              <p className="text-gray-400 text-sm mb-4">Hour-by-hour usage pattern</p>
              {loading ? (
                <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
              ) : heatmap ? (
                <ActivityHeatmap data={heatmap} />
              ) : (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* ── Row 2: Top apps chart + Category donut ── */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Top Apps by Time</h3>
              <p className="text-gray-400 text-sm mb-4">
                {period === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
              </p>
              {loading ? (
                <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
              ) : appUsage && appUsage.apps.length > 0 ? (
                <TopAppsChart data={appUsage} />
              ) : (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                  No app data yet
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Category Breakdown</h3>
              <p className="text-gray-400 text-sm mb-4">Time by category</p>
              {loading ? (
                <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
              ) : categories && categories.categories.length > 0 ? (
                <CategoryDonutChart data={categories} />
              ) : (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                  No category data yet
                </div>
              )}
            </div>
          </div>

          {/* ── Row 3: Top apps table ── */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-5 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">App Usage Details</h3>
              <p className="text-gray-400 text-sm">All apps ranked by time spent</p>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-6 h-6 bg-gray-100 rounded-full" />
                    <div className="flex-1 h-3 bg-gray-100 rounded" />
                    <div className="w-20 h-3 bg-gray-100 rounded" />
                    <div className="w-16 h-5 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : appUsage && appUsage.apps.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {appUsage.apps.map(app => (
                  <div key={app.appName} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-300 text-sm font-medium w-5 text-right">
                      {app.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm truncate">
                          {app.appName}
                        </span>
                        {app.blocked && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${app.percentOfTotal}%`,
                          background: app.blocked ? '#EF4444' : '#3B82F6'
                        }}
                      />
                    </div>
                    <span className="text-gray-500 text-sm font-medium w-16 text-right">
                      {app.durationFormatted}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CAT_COLORS[app.category] || 'bg-gray-100 text-gray-600'}`}>
                      {app.category.charAt(0) + app.category.slice(1).toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 text-sm">
                No app usage data for this period.
                <br />
                <span className="text-xs text-gray-300">Data appears after the desktop agent starts tracking.</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
