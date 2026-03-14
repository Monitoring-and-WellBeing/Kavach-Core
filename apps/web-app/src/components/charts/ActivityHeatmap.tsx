'use client'
import { HeatmapData } from '@/lib/reports'

interface Props { data: HeatmapData }

const INTENSITY_COLORS = ['#F3F4F6', '#FCD34D', '#F97316', '#EF4444']
const DISPLAY_HOURS = [6, 9, 12, 15, 18, 21] // labels to show

function HeatCell({ intensity, tooltip }: { intensity: number; tooltip: string }) {
  return (
    <div
      className="w-4 h-4 rounded-sm cursor-default transition-all hover:ring-1 hover:ring-gray-300"
      style={{ background: INTENSITY_COLORS[intensity] }}
      title={tooltip}
    />
  )
}

export function ActivityHeatmap({ data }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-0.5 min-w-max">
        {/* Day labels column */}
        <div className="flex flex-col gap-0.5 mr-1">
          <div className="h-4 w-8" /> {/* header spacer */}
          {data.rows.map(row => (
            <div key={row.date} className="h-4 w-8 flex items-center">
              <span className="text-gray-400 text-xs">{row.dayLabel}</span>
            </div>
          ))}
        </div>

        {/* Hour columns */}
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="flex flex-col gap-0.5">
            {/* Hour label */}
            <div className="h-4 w-4 flex items-center justify-center">
              {DISPLAY_HOURS.includes(h) && (
                <span className="text-gray-300 text-xs leading-none">{h}</span>
              )}
            </div>
            {/* Cells */}
            {data.rows.map(row => (
              <HeatCell
                key={row.date}
                intensity={row.hours[h] ?? 0}
                tooltip={`${row.dayLabel} ${h}:00 — ${
                  row.hours[h] === 0 ? 'No activity' :
                  row.hours[h] === 1 ? 'Low activity' :
                  row.hours[h] === 2 ? 'Medium activity' : 'High activity'
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-gray-400 text-xs">Less</span>
        {INTENSITY_COLORS.map((c, i) => (
          <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-gray-400 text-xs">More</span>
      </div>
    </div>
  )
}
